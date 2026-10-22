package com.chat.message.repository;

import com.chat.message.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    List<Message> findLatestByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.createdAt < :before ORDER BY m.createdAt DESC")
    List<Message> findByConversationIdAndCreatedAtBefore(
        @Param("conversationId") UUID conversationId,
        @Param("before") Instant before,
        Pageable pageable
    );

    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    Optional<Message> findBySenderIdAndClientMessageId(UUID senderId, UUID clientMessageId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id <> :userId AND m.createdAt > :lastReadTime")
    long countUnreadAfter(
        @Param("conversationId") UUID conversationId,
        @Param("userId") UUID userId,
        @Param("lastReadTime") Instant lastReadTime
    );

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id <> :userId")
    long countAllIncoming(
        @Param("conversationId") UUID conversationId,
        @Param("userId") UUID userId
    );

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Message m WHERE m.conversation.id = :conversationId")
    void deleteByConversationId(@Param("conversationId") UUID conversationId);
}
