package com.chat.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @JsonAlias({"username", "email"})
    @NotBlank String usernameOrEmail,
    @NotBlank String password,
    String twoFactorPin,
    String deviceId,
    String deviceName,
    String platform,
    String browser
) {
    public LoginRequest(String usernameOrEmail, String password) {
        this(usernameOrEmail, password, null, null, null, null, null);
    }
}
