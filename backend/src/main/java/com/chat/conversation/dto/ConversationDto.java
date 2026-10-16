package com.chat.conversation.dto;

import com.chat.message.dto.MessageDto;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ConversationDto(
    UUID id,
    String type,
    String title,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt,
    List<ConversationMemberDto> members,
    MessageDto lastMessage,
    long unreadCount
) {}
