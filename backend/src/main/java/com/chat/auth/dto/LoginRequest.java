package com.chat.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @JsonAlias({"username", "email"})
    @NotBlank String usernameOrEmail,
    @NotBlank String password
) {}
