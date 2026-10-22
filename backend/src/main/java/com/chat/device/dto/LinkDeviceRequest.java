package com.chat.device.dto;

public record LinkDeviceRequest(
    String deviceName,
    String platform,
    String browser,
    String location,
    String ipAddress
) {}
