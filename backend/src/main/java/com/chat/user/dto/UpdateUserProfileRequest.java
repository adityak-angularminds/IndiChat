package com.chat.user.dto;

public record UpdateUserProfileRequest(
    String displayName,
    String username,
    String email,
    String phoneNumber
) {}
