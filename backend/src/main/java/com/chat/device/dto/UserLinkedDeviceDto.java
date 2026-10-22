package com.chat.device.dto;

import com.chat.device.entity.UserLinkedDevice;
import java.time.Instant;
import java.util.UUID;

public record UserLinkedDeviceDto(
    UUID id,
    String name,
    String platform,
    String browser,
    String location,
    String ipAddress,
    String lastActive,
    boolean isCurrent,
    Instant lastActiveAt
) {
    public static UserLinkedDeviceDto fromEntity(UserLinkedDevice device) {
        String lastActiveDesc = device.isCurrent() ? "Active now" : "Recently active";
        return new UserLinkedDeviceDto(
            device.getId(),
            device.getDeviceName(),
            device.getPlatform(),
            device.getBrowser(),
            device.getLocation(),
            device.getIpAddress(),
            lastActiveDesc,
            device.isCurrent(),
            device.getLastActiveAt()
        );
    }
}
