package com.chat.receipt.repository;

import com.chat.receipt.entity.MessageReceipt;
import com.chat.receipt.entity.MessageReceiptId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, MessageReceiptId> {

    List<MessageReceipt> findByIdMessageId(UUID messageId);

    Optional<MessageReceipt> findByIdMessageIdAndIdUserId(UUID messageId, UUID userId);

    @Modifying
    @Query("UPDATE MessageReceipt r SET r.deliveredAt = :timestamp " +
           "WHERE r.id.messageId = :messageId AND r.id.userId = :userId AND r.deliveredAt IS NULL")
    int markDelivered(
        @Param("messageId") UUID messageId,
        @Param("userId") UUID userId,
        @Param("timestamp") Instant timestamp
    );

    @Modifying
    @Query("UPDATE MessageReceipt r SET r.readAt = :timestamp, r.deliveredAt = COALESCE(r.deliveredAt, :timestamp) " +
           "WHERE r.id.messageId = :messageId AND r.id.userId = :userId AND r.readAt IS NULL")
    int markRead(
        @Param("messageId") UUID messageId,
        @Param("userId") UUID userId,
        @Param("timestamp") Instant timestamp
    );
}
