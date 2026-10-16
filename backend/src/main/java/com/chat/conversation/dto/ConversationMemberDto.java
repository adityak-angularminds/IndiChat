package com.chat.conversation.dto;

import com.chat.conversation.entity.ConversationMember;
import com.chat.user.dto.UserDto;
import java.time.Instant;
import java.util.UUID;

public record ConversationMemberDto(
    UUID userId,
    String role,
    Instant joinedAt,
    UUID lastReadMessageId,
    UserDto user
) {
    public static ConversationMemberDto fromEntity(ConversationMember member, boolean isOnline) {
        return new ConversationMemberDto(
            member.getUser().getId(),
            member.getRole(),
            member.getJoinedAt(),
            member.getLastReadMessageId(),
            UserDto.fromEntity(member.getUser(), isOnline)
        );
    }
}
