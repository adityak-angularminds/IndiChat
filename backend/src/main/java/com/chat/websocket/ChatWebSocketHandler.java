package com.chat.websocket;

import com.chat.conversation.entity.ConversationMember;
import com.chat.conversation.repository.ConversationMemberRepository;
import com.chat.message.dto.MessageDto;
import com.chat.message.dto.MessageReceiptDto;
import com.chat.message.dto.SendMessageRequest;
import com.chat.message.service.MessageService;
import com.chat.presence.PresenceService;
import com.chat.security.JwtTokenProvider;
import com.chat.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final JwtTokenProvider tokenProvider;
    private final MessageService messageService;
    private final ConversationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final ObjectMapper objectMapper;

    // Active session mappings
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final Map<String, UUID> sessionToUser = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
        JwtTokenProvider tokenProvider,
        MessageService messageService,
        ConversationMemberRepository memberRepository,
        UserRepository userRepository,
        PresenceService presenceService,
        ObjectMapper objectMapper
    ) {
        this.tokenProvider = tokenProvider;
        this.messageService = messageService;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = extractUserId(session);
        if (userId == null) {
            log.warn("Unauthorized WebSocket handshake attempt");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        sessionToUser.put(session.getId(), userId);
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(session);
        presenceService.setUserOnline(userId);

        log.info("WebSocket connected for user: {}", userId);

        // Broadcast presence
        broadcastPresence(userId, true, Instant.now());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID userId = sessionToUser.remove(session.getId());
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                    presenceService.setUserOffline(userId);

                    Instant now = Instant.now();
                    userRepository.findById(userId).ifPresent(u -> {
                        u.setLastSeenAt(now);
                        userRepository.save(u);
                    });

                    broadcastPresence(userId, false, now);
                }
            }
            log.info("WebSocket closed for user: {}", userId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID userId = sessionToUser.get(session.getId());
        if (userId == null) return;

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String type = root.path("type").asText();
            String requestId = root.path("requestId").asText(null);
            JsonNode payload = root.path("payload");

            switch (type) {
                case "message.send" -> handleSendMessage(userId, requestId, payload);
                case "message.delivered" -> handleMessageDelivered(userId, payload);
                case "message.read" -> handleMessageRead(userId, payload);
                case "typing.start" -> handleTyping(userId, payload, true);
                case "typing.stop" -> handleTyping(userId, payload, false);
                case "presence.subscribe" -> handlePresenceSubscribe(session, payload);
                case "call.signal" -> handleCallSignal(userId, payload);
                default -> log.debug("Unknown socket message type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error processing socket message", e);
            sendToSession(session, Map.of(
                "type", "error",
                "payload", Map.of("message", e.getMessage() != null ? e.getMessage() : "Internal error")
            ));
        }
    }

    private void handleSendMessage(UUID senderId, String requestId, JsonNode payload) {
        UUID conversationId = UUID.fromString(payload.path("conversationId").asText());
        UUID clientMessageId = UUID.fromString(payload.path("clientMessageId").asText());
        String content = payload.path("content").asText("");
        String messageType = payload.path("messageType").asText("TEXT");
        UUID replyToId = payload.hasNonNull("replyToId") ? UUID.fromString(payload.path("replyToId").asText()) : null;

        SendMessageRequest req = new SendMessageRequest(conversationId, clientMessageId, messageType, content, replyToId);
        MessageDto created = messageService.sendMessage(req, senderId);

        // Notify all online members of this conversation
        List<ConversationMember> members = memberRepository.findByIdConversationId(conversationId);
        Map<String, Object> event = new HashMap<>();
        event.put("type", "message.created");
        if (requestId != null) event.put("requestId", requestId);
        event.put("payload", created);

        for (ConversationMember member : members) {
            sendToUser(member.getUser().getId(), event);
        }
    }

    private void handleMessageDelivered(UUID userId, JsonNode payload) {
        UUID messageId = UUID.fromString(payload.path("messageId").asText());
        MessageReceiptDto receipt = messageService.markDelivered(messageId, userId);
        if (receipt != null) {
            broadcastReceipt(receipt, payload.path("conversationId").asText(null));
        }
    }

    private void handleMessageRead(UUID userId, JsonNode payload) {
        UUID messageId = UUID.fromString(payload.path("messageId").asText());
        MessageReceiptDto receipt = messageService.markRead(messageId, userId);
        if (receipt != null) {
            broadcastReceipt(receipt, payload.path("conversationId").asText(null));
        }
    }

    private void broadcastReceipt(MessageReceiptDto receipt, String conversationIdStr) {
        Map<String, Object> event = Map.of(
            "type", "message.receipt.updated",
            "payload", receipt
        );

        if (conversationIdStr != null && !conversationIdStr.isBlank()) {
            UUID conversationId = UUID.fromString(conversationIdStr);
            List<ConversationMember> members = memberRepository.findByIdConversationId(conversationId);
            for (ConversationMember member : members) {
                sendToUser(member.getUser().getId(), event);
            }
        }
    }

    private void handleTyping(UUID userId, JsonNode payload, boolean isTyping) {
        UUID conversationId = UUID.fromString(payload.path("conversationId").asText());
        List<ConversationMember> members = memberRepository.findByIdConversationId(conversationId);

        Map<String, Object> event = Map.of(
            "type", "typing.updated",
            "payload", Map.of(
                "conversationId", conversationId.toString(),
                "userId", userId.toString(),
                "isTyping", isTyping
            )
        );

        for (ConversationMember member : members) {
            if (!member.getUser().getId().equals(userId)) {
                sendToUser(member.getUser().getId(), event);
            }
        }
    }

    private void handlePresenceSubscribe(WebSocketSession session, JsonNode payload) {
        JsonNode userIdsNode = payload.path("userIds");
        if (userIdsNode.isArray()) {
            List<Map<String, Object>> list = new ArrayList<>();
            for (JsonNode idNode : userIdsNode) {
                UUID targetId = UUID.fromString(idNode.asText());
                boolean online = presenceService.isUserOnline(targetId);
                list.add(Map.of("userId", targetId.toString(), "isOnline", online));
            }
            sendToSession(session, Map.of("type", "presence.batch", "payload", list));
        }
    }

    private void handleCallSignal(UUID senderId, JsonNode payload) {
        UUID targetUserId = UUID.fromString(payload.path("targetUserId").asText());
        Map<String, Object> event = Map.of(
            "type", "call.signal",
            "payload", Map.of(
                "senderUserId", senderId.toString(),
                "signalType", payload.path("signalType").asText(),
                "data", payload.path("data")
            )
        );
        sendToUser(targetUserId, event);
    }

    private void broadcastPresence(UUID userId, boolean isOnline, Instant timestamp) {
        Map<String, Object> event = Map.of(
            "type", "presence.updated",
            "payload", Map.of(
                "userId", userId.toString(),
                "isOnline", isOnline,
                "lastSeenAt", timestamp.toString()
            )
        );

        // Broadcast to all active sessions across users
        userSessions.keySet().forEach(recipientId -> {
            if (!recipientId.equals(userId)) {
                sendToUser(recipientId, event);
            }
        });
    }

    public void sendToUser(UUID userId, Object payload) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                sendToSession(s, payload);
            }
        }
    }

    private void sendToSession(WebSocketSession session, Object payload) {
        if (session != null && session.isOpen()) {
            try {
                String text = objectMapper.writeValueAsString(payload);
                synchronized (session) {
                    session.sendMessage(new TextMessage(text));
                }
            } catch (IOException e) {
                log.warn("Failed to send WebSocket message: {}", e.getMessage());
            }
        }
    }

    private UUID extractUserId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;

        String query = uri.getQuery();
        if (query != null && query.contains("token=")) {
            for (String param : query.split("&")) {
                if (param.startsWith("token=")) {
                    String token = param.substring(6);
                    if (tokenProvider.validateToken(token)) {
                        return tokenProvider.getUserIdFromToken(token);
                    }
                }
            }
        }

        // Check Authorization header in handshake
        List<String> authHeaders = session.getHandshakeHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (tokenProvider.validateToken(token)) {
                    return tokenProvider.getUserIdFromToken(token);
                }
            }
        }

        return null;
    }
}
