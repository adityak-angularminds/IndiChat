package com.chat.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterDeviceTokenRequest(
    @NotBlank String token,
    String platform
) {}
