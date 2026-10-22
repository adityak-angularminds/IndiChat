package com.chat.device.controller;

import com.chat.device.dto.LinkDeviceRequest;
import com.chat.device.dto.UserLinkedDeviceDto;
import com.chat.device.service.UserLinkedDeviceService;
import com.chat.security.CustomUserDetails;
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
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<UserLinkedDeviceDto> devices = deviceService.getUserDevices(userDetails.getId());
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
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        deviceService.removeAllOtherDevices(userDetails.getId());
        return ResponseEntity.ok(Map.of("message", "Logged out from all other devices"));
    }
}
