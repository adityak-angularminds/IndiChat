package com.chat.user.dto;

import com.chat.user.entity.User;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
    UUID id,
    String phoneNumber,
    String email,
    String username,
    String displayName,
    String avatarKey,
    Instant createdAt,
    Instant updatedAt,
    Instant lastSeenAt,
    String status,
    boolean isOnline
) {
    public static UserDto fromEntity(User user, boolean isOnline) {
        return new UserDto(
            user.getId(),
            user.getPhoneNumber(),
            user.getEmail(),
            user.getUsername(),
            user.getDisplayName(),
            user.getAvatarKey(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getLastSeenAt(),
            user.getStatus(),
            isOnline
        );
    }
}
