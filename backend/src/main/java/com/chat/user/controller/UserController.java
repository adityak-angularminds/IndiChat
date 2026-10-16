package com.chat.user.controller;

import com.chat.security.CustomUserDetails;
import com.chat.user.dto.UserDto;
import com.chat.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
        @RequestParam(value = "q", required = false, defaultValue = "") String query,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<UserDto> results = userService.searchUsers(query, userDetails.getId());
        return ResponseEntity.ok(results);
    }
}
