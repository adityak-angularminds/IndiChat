package com.chat.auth.dto;

import com.chat.user.dto.UserDto;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    AuthTokens tokens,
    UserDto user,
    Boolean requiresTwoFactor,
    String message
) {
    public AuthResponse(AuthTokens tokens, UserDto user) {
        this(tokens, user, null, null);
    }

    public static AuthResponse twoFactorRequired(String message) {
        return new AuthResponse(null, null, true, message);
    }
}
