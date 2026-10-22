package com.chat.user.controller;

import com.chat.security.CustomUserDetails;
import com.chat.user.dto.*;
import com.chat.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserDto profile = userService.getUserProfile(userDetails.getId());
        return ResponseEntity.ok(profile);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(
        @RequestBody UpdateUserProfileRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserDto updated = userService.updateUserProfile(userDetails.getId(), request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
        @RequestBody ChangePasswordRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        userService.changePassword(userDetails.getId(), request.currentPassword(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PostMapping("/me/passkey")
    public ResponseEntity<Map<String, String>> updatePasskey(
        @RequestBody PasskeyRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        userService.updatePasskey(userDetails.getId(), request.enabled());
        return ResponseEntity.ok(Map.of("message", "Passkey status updated"));
    }

    @PostMapping("/me/2fa")
    public ResponseEntity<Map<String, String>> updateTwoFactor(
        @RequestBody TwoFactorRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        userService.updateTwoFactor(userDetails.getId(), request.enabled(), request.pin());
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication updated"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
        @RequestParam(value = "q", required = false, defaultValue = "") String query,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<UserDto> results = userService.searchUsers(query, userDetails.getId());
        return ResponseEntity.ok(results);
    }
}
