package com.chat.message.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendMessageRequest(
    @NotNull UUID conversationId,
    @NotNull UUID clientMessageId,
    String messageType,
    String content,
    UUID replyToId
) {}
