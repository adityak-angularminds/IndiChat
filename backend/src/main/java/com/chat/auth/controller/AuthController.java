package com.chat.auth.controller;

import com.chat.auth.dto.*;
import com.chat.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.chat.security.CustomUserDetails;
import com.chat.websocket.ChatWebSocketHandler;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    public AuthController(AuthService authService, ChatWebSocketHandler chatWebSocketHandler) {
        this.authService = authService;
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest servletRequest
    ) {
        AuthResponse response = authService.register(request, servletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest servletRequest
    ) {
        AuthResponse response = authService.login(request, servletRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokens> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthTokens tokens = authService.refreshToken(request);
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestHeader(value = "X-Device-Id", required = false) String deviceIdHeader,
        HttpServletRequest servletRequest
    ) {
        UUID userId = userDetails != null ? userDetails.getId() : null;
        UUID deviceUuid = null;
        if (deviceIdHeader != null && !deviceIdHeader.isBlank()) {
            try {
                deviceUuid = UUID.fromString(deviceIdHeader.trim());
            } catch (Exception ignored) {}
        }

        UUID resolvedUserId = authService.logout(userId, deviceIdHeader, servletRequest);
        if (resolvedUserId != null && deviceUuid != null) {
            chatWebSocketHandler.disconnectDevice(resolvedUserId, deviceUuid, "Logged out successfully");
        }

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
