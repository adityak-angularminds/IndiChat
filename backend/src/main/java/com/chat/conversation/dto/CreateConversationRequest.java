package com.chat.conversation.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record CreateConversationRequest(
    @NotNull String type, // DIRECT or GROUP
    String title,
    @NotEmpty List<UUID> participantIds
) {}
