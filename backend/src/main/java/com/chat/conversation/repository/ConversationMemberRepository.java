package com.chat.conversation.repository;

import com.chat.conversation.entity.ConversationMember;
import com.chat.conversation.entity.ConversationMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationMemberRepository extends JpaRepository<ConversationMember, ConversationMemberId> {
    List<ConversationMember> findByIdConversationId(UUID conversationId);
    Optional<ConversationMember> findByIdConversationIdAndIdUserId(UUID conversationId, UUID userId);
    boolean existsByIdConversationIdAndIdUserId(UUID conversationId, UUID userId);
}
