package com.chat.contact.dto;

import com.chat.user.dto.UserDto;
import java.time.Instant;
import java.util.UUID;

public record ContactDto(
    UUID contactUserId,
    String nickname,
    Instant createdAt,
    UserDto user
) {}
