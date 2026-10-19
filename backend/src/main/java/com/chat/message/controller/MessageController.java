package com.chat.message.controller;

import com.chat.message.dto.MessageDto;
import com.chat.message.dto.MessageHistoryResponse;
import com.chat.message.dto.SendMessageRequest;
import com.chat.message.service.MessageService;
import com.chat.security.CustomUserDetails;
import com.chat.websocket.ChatWebSocketHandler;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MessageController {

    private final MessageService messageService;
    private final ChatWebSocketHandler chatWebSocketHandler;
    private final com.chat.notification.service.PushNotificationService pushNotificationService;

    public MessageController(
        MessageService messageService,
        ChatWebSocketHandler chatWebSocketHandler,
        com.chat.notification.service.PushNotificationService pushNotificationService
    ) {
        this.messageService = messageService;
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.pushNotificationService = pushNotificationService;
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageHistoryResponse> getMessages(
        @PathVariable("conversationId") UUID conversationId,
        @RequestParam(value = "cursor", required = false) String cursor,
        @RequestParam(value = "limit", required = false, defaultValue = "50") int limit,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Instant cursorTime = (cursor != null && !cursor.isBlank()) ? Instant.parse(cursor) : null;
        MessageHistoryResponse response = messageService.getMessageHistory(conversationId, userDetails.getId(), cursorTime, limit);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDto> sendMessage(
        @Valid @RequestBody SendMessageRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        MessageDto message = messageService.sendMessage(request, userDetails.getId());
        chatWebSocketHandler.broadcastMessageCreated(request.conversationId(), message, null);
        pushNotificationService.sendNotificationForMessage(request.conversationId(), message, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    @PostMapping("/messages/{messageId}/delivered")
    public ResponseEntity<Void> markDelivered(
        @PathVariable("messageId") UUID messageId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        var receipt = messageService.markDelivered(messageId, userDetails.getId());
        if (receipt != null) {
            chatWebSocketHandler.broadcastReceipt(receipt, null);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markRead(
        @PathVariable("messageId") UUID messageId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        var receipt = messageService.markRead(messageId, userDetails.getId());
        if (receipt != null) {
            chatWebSocketHandler.broadcastReceipt(receipt, null);
        }
        return ResponseEntity.noContent().build();
    }
}
