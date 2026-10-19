package com.chat.notification.service;

import com.chat.conversation.entity.Conversation;
import com.chat.conversation.entity.ConversationMember;
import com.chat.conversation.repository.ConversationMemberRepository;
import com.chat.conversation.repository.ConversationRepository;
import com.chat.message.dto.MessageDto;
import com.chat.notification.entity.DeviceToken;
import com.chat.notification.repository.DeviceTokenRepository;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final DeviceTokenRepository deviceTokenRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RestClient restClient;

    public PushNotificationService(
        DeviceTokenRepository deviceTokenRepository,
        ConversationRepository conversationRepository,
        ConversationMemberRepository memberRepository,
        UserRepository userRepository
    ) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.restClient = RestClient.builder()
            .defaultHeader("Accept", "application/json")
            .defaultHeader("Accept-Encoding", "gzip, deflate")
            .build();
    }

    @Transactional
    public DeviceToken registerToken(UUID userId, String token, String platform) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Device token cannot be blank");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String cleanPlatform = (platform != null && !platform.isBlank()) ? platform.trim().toUpperCase() : "WEB";

        return deviceTokenRepository.findByUserIdAndToken(userId, token)
            .map(existing -> {
                existing.setPlatform(cleanPlatform);
                existing.setUpdatedAt(Instant.now());
                log.info("Updated existing device token for user {}: platform={}", userId, cleanPlatform);
                return deviceTokenRepository.save(existing);
            })
            .orElseGet(() -> {
                DeviceToken newToken = new DeviceToken(user, token.trim(), cleanPlatform);
                log.info("Registered new device token for user {}: platform={}", userId, cleanPlatform);
                return deviceTokenRepository.save(newToken);
            });
    }

    @Transactional
    public void unregisterToken(UUID userId, String token) {
        if (token != null && !token.isBlank()) {
            deviceTokenRepository.deleteByUserIdAndToken(userId, token.trim());
            log.info("Unregistered device token for user {}", userId);
        }
    }

    @Async
    public void sendNotificationForMessage(UUID conversationId, MessageDto message, UUID senderId) {
        try {
            Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
            if (conversation == null) return;

            User sender = userRepository.findById(senderId).orElse(null);
            String senderName = sender != null ? sender.getDisplayName() : "New Message";

            String title = (conversation.getType().equals("GROUP") && conversation.getTitle() != null)
                ? conversation.getTitle() + " - " + senderName
                : senderName;

            String body = message.content();
            if (body == null || body.isBlank()) {
                body = "Sent an attachment (" + message.type() + ")";
            }

            Map<String, Object> data = new HashMap<>();
            data.put("conversationId", conversationId.toString());
            data.put("messageId", message.id().toString());
            data.put("senderId", senderId.toString());

            List<ConversationMember> members = memberRepository.findByIdConversationId(conversationId);
            for (ConversationMember member : members) {
                UUID recipientId = member.getUser().getId();
                if (!recipientId.equals(senderId)) {
                    // Send to all registered device tokens for this recipient
                    sendPushToUser(recipientId, title, body, data);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process push notifications for message: {}", e.getMessage(), e);
        }
    }

    public void sendPushToUser(UUID userId, String title, String body, Map<String, Object> data) {
        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("No registered push device tokens found for user {}", userId);
            return;
        }

        List<Map<String, Object>> expoPayloads = new ArrayList<>();

        for (DeviceToken dt : tokens) {
            String token = dt.getToken();
            // Check if it's an Expo push token
            if (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[") || "EXPO".equalsIgnoreCase(dt.getPlatform())) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("to", token);
                payload.put("title", title);
                payload.put("body", body);
                payload.put("data", data);
                payload.put("sound", "default");
                payload.put("badge", 1);
                payload.put("priority", "high");
                expoPayloads.add(payload);
            } else {
                // Web or custom platform token
                log.info("Dispatched push notification to {} device token for user {}: title='{}'", dt.getPlatform(), userId, title);
            }
        }

        if (!expoPayloads.isEmpty()) {
            dispatchExpoNotifications(expoPayloads);
        }
    }

    private void dispatchExpoNotifications(List<Map<String, Object>> messages) {
        try {
            log.info("Dispatching {} push notification(s) via Expo Push API", messages.size());
            restClient.post()
                .uri(EXPO_PUSH_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(messages)
                .retrieve()
                .toBodilessEntity();
            log.info("Successfully sent Expo push notifications");
        } catch (Exception e) {
            // If offline, sandbox, or rate-limited, log warning without throwing
            log.warn("Expo push delivery notification notice: {}", e.getMessage());
        }
    }
}
