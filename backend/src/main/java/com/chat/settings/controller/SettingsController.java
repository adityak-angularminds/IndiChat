package com.chat.settings.controller;

import com.chat.security.CustomUserDetails;
import com.chat.settings.dto.UpdateSettingsRequest;
import com.chat.settings.dto.UserSettingsDto;
import com.chat.settings.service.UserSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final UserSettingsService settingsService;

    public SettingsController(UserSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<UserSettingsDto> getSettings(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserSettingsDto dto = settingsService.getSettings(userDetails.getId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<UserSettingsDto> updateSettings(
        @RequestBody UpdateSettingsRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserSettingsDto updated = settingsService.updateSettings(userDetails.getId(), request);
        return ResponseEntity.ok(updated);
    }
}
