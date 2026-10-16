package com.chat.conversation.repository;

import com.chat.conversation.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN c.members m WHERE m.id.userId = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findConversationsByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c JOIN c.members m1 JOIN c.members m2 " +
           "WHERE c.type = 'DIRECT' AND m1.id.userId = :user1Id AND m2.id.userId = :user2Id")
    Optional<Conversation> findDirectConversationBetween(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
}
