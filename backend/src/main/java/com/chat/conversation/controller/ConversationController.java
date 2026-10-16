package com.chat.conversation.controller;

import com.chat.conversation.dto.ConversationDto;
import com.chat.conversation.dto.CreateConversationRequest;
import com.chat.conversation.service.ConversationService;
import com.chat.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationDto>> getConversations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ConversationDto> conversations = conversationService.getUserConversations(userDetails.getId());
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDto> getConversation(
        @PathVariable("id") UUID id,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ConversationDto conversation = conversationService.getConversation(id, userDetails.getId());
        return ResponseEntity.ok(conversation);
    }

    @PostMapping
    public ResponseEntity<ConversationDto> createConversation(
        @Valid @RequestBody CreateConversationRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ConversationDto conversation = conversationService.createConversation(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }
}
