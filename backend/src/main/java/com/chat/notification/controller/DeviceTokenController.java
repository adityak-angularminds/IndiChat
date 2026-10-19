package com.chat.notification.controller;

import com.chat.notification.dto.RegisterDeviceTokenRequest;
import com.chat.notification.entity.DeviceToken;
import com.chat.notification.service.PushNotificationService;
import com.chat.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/devices")
public class DeviceTokenController {

    private final PushNotificationService pushNotificationService;

    public DeviceTokenController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> registerToken(
        @Valid @RequestBody RegisterDeviceTokenRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        DeviceToken dt = pushNotificationService.registerToken(
            userDetails.getId(),
            request.token(),
            request.platform()
        );

        return ResponseEntity.ok(Map.of(
            "status", "registered",
            "token", dt.getToken(),
            "platform", dt.getPlatform(),
            "updatedAt", dt.getUpdatedAt().toString()
        ));
    }

    @DeleteMapping("/token")
    public ResponseEntity<Void> unregisterToken(
        @RequestParam(value = "token", required = false) String tokenParam,
        @RequestBody(required = false) Map<String, String> body,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String token = tokenParam;
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("token");
        }
        if (token != null && !token.isBlank()) {
            pushNotificationService.unregisterToken(userDetails.getId(), token);
        }
        return ResponseEntity.noContent().build();
    }
}
