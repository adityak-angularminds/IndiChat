package com.chat.device.controller;

import com.chat.device.dto.LinkDeviceRequest;
import com.chat.device.dto.UserLinkedDeviceDto;
import com.chat.device.service.UserLinkedDeviceService;
import com.chat.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices")
public class LinkedDeviceController {

    private final UserLinkedDeviceService deviceService;

    public LinkedDeviceController(UserLinkedDeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public ResponseEntity<List<UserLinkedDeviceDto>> getLinkedDevices(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceIdStr,
        @RequestHeader(value = "X-Device-Name", required = false) String deviceName,
        @RequestHeader(value = "X-Device-Platform", required = false) String platform,
        @RequestHeader(value = "X-Device-Browser", required = false) String browser,
        HttpServletRequest servletRequest
    ) {
        UUID currentDeviceId = null;
        if (currentDeviceIdStr != null && !currentDeviceIdStr.isBlank()) {
            try {
                currentDeviceId = UUID.fromString(currentDeviceIdStr.trim());
            } catch (Exception ignored) {}
        }
        String ip = servletRequest != null ? servletRequest.getHeader("X-Forwarded-For") : null;
        if (ip == null || ip.isBlank()) {
            ip = servletRequest != null ? servletRequest.getRemoteAddr() : "127.0.0.1";
        }

        List<UserLinkedDeviceDto> devices = deviceService.getUserDevices(
            userDetails.getId(), currentDeviceId, deviceName, platform, browser, ip
        );
        return ResponseEntity.ok(devices);
    }

    @PostMapping("/link")
    public ResponseEntity<UserLinkedDeviceDto> linkDevice(
        @RequestBody LinkDeviceRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserLinkedDeviceDto linked = deviceService.linkDevice(userDetails.getId(), request);
        return ResponseEntity.ok(linked);
    }

    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Map<String, String>> removeDevice(
        @PathVariable("deviceId") UUID deviceId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        deviceService.removeDevice(userDetails.getId(), deviceId);
        return ResponseEntity.ok(Map.of("message", "Device removed successfully"));
    }

    @DeleteMapping("/others")
    public ResponseEntity<Map<String, String>> removeOtherDevices(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestHeader(value = "X-Device-Id", required = false) String currentDeviceIdStr
    ) {
        UUID currentDeviceId = null;
        if (currentDeviceIdStr != null && !currentDeviceIdStr.isBlank()) {
            try {
                currentDeviceId = UUID.fromString(currentDeviceIdStr.trim());
            } catch (Exception ignored) {}
        }
        deviceService.removeAllOtherDevices(userDetails.getId(), currentDeviceId);
        return ResponseEntity.ok(Map.of("message", "Logged out from all other devices"));
    }
}
