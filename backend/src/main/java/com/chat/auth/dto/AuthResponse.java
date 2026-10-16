package com.chat.auth.dto;

import com.chat.user.dto.UserDto;

public record AuthResponse(
    AuthTokens tokens,
    UserDto user
) {}
