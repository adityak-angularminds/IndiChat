package com.chat.device.dto;

import com.chat.device.entity.UserLinkedDevice;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
        return fromEntity(device, device.isCurrent());
    }

    public static UserLinkedDeviceDto fromEntity(UserLinkedDevice device, boolean isCurrent) {
        String lastActiveDesc;
        if (isCurrent) {
            lastActiveDesc = "Active now";
        } else {
            lastActiveDesc = formatRelativeTime(device.getLastActiveAt());
        }

        return new UserLinkedDeviceDto(
            device.getId(),
            device.getDeviceName(),
            device.getPlatform(),
            device.getBrowser(),
            device.getLocation() != null ? device.getLocation() : "Pune, India",
            device.getIpAddress() != null ? device.getIpAddress() : "192.168.1.100",
            lastActiveDesc,
            isCurrent,
            device.getLastActiveAt()
        );
    }

    private static String formatRelativeTime(Instant instant) {
        if (instant == null) return "Recently active";
        try {
            Duration diff = Duration.between(instant, Instant.now());
            long minutes = diff.toMinutes();
            if (minutes < 2) return "Active just now";
            if (minutes < 60) return minutes + " minutes ago";
            long hours = diff.toHours();
            if (hours < 24) {
                DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneId.systemDefault());
                return "Today at " + timeFmt.format(instant);
            }
            if (hours < 48) {
                DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneId.systemDefault());
                return "Yesterday at " + timeFmt.format(instant);
            }
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneId.systemDefault());
            return dateFmt.format(instant);
        } catch (Exception e) {
            return "Recently active";
        }
    }
}
