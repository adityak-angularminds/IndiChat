package com.chat.user.service;

import com.chat.presence.PresenceService;
import com.chat.user.dto.UserDto;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public UserService(UserRepository userRepository, PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean online = presenceService.isUserOnline(userId);
        return UserDto.fromEntity(user, online);
    }

    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, UUID currentUserId) {
        if (query == null || query.trim().length() < 1) {
            return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .limit(20)
                .map(u -> UserDto.fromEntity(u, presenceService.isUserOnline(u.getId())))
                .toList();
        }

        return userRepository.searchUsers(query.trim()).stream()
            .filter(u -> !u.getId().equals(currentUserId))
            .map(u -> UserDto.fromEntity(u, presenceService.isUserOnline(u.getId())))
            .toList();
    }
}
