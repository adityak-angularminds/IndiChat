package com.chat.auth.service;

import com.chat.auth.dto.*;
import com.chat.auth.entity.RefreshToken;
import com.chat.auth.repository.RefreshTokenRepository;
import com.chat.security.JwtTokenProvider;
import com.chat.user.dto.UserDto;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider tokenProvider
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.findByUsername(req.username()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (req.email() != null && !req.email().isBlank() && userRepository.findByEmail(req.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (req.phoneNumber() != null && !req.phoneNumber().isBlank() && userRepository.findByPhoneNumber(req.phoneNumber()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        String encodedPassword = passwordEncoder.encode(req.password());
        User user = new User(req.username(), req.email(), req.phoneNumber(), encodedPassword, req.displayName());
        user = userRepository.save(user);

        return createAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsernameOrEmail(req.usernameOrEmail())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        user.setLastSeenAt(Instant.now());
        userRepository.save(user);

        return createAuthResponse(user);
    }

    @Transactional
    public AuthTokens refreshToken(RefreshRequest req) {
        String token = req.refreshToken();
        if (!tokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }

        User user = refreshToken.getUser();
        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getDisplayName());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId());

        // Revoke old and save new
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        RefreshToken nextToken = new RefreshToken(user, newRefreshToken, Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokenRepository.save(nextToken);

        return new AuthTokens(newAccessToken, newRefreshToken, "Bearer", tokenProvider.getExpirationMs());
    }

    private AuthResponse createAuthResponse(User user) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername(), user.getDisplayName());
        String refreshTokenStr = tokenProvider.generateRefreshToken(user.getId());

        RefreshToken refreshToken = new RefreshToken(user, refreshTokenStr, Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        AuthTokens tokens = new AuthTokens(accessToken, refreshTokenStr, "Bearer", tokenProvider.getExpirationMs());
        UserDto userDto = UserDto.fromEntity(user, true);

        return new AuthResponse(tokens, userDto);
    }
}
