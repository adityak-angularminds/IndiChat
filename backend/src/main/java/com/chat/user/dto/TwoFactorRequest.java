package com.chat.user.dto;

public record TwoFactorRequest(
    boolean enabled,
    String pin
) {}
