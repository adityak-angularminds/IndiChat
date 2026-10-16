package com.chat.conversation.entity;

import com.chat.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_members")
public class ConversationMember {

    @EmbeddedId
    private ConversationMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("conversationId")
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    private String role = "MEMBER";

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();

    @Column(name = "last_read_message_id")
    private UUID lastReadMessageId;

    @Column(name = "muted_until")
    private Instant mutedUntil;

    public ConversationMember() {}

    public ConversationMember(Conversation conversation, User user, String role) {
        this.id = new ConversationMemberId(conversation.getId(), user.getId());
        this.conversation = conversation;
        this.user = user;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public ConversationMemberId getId() { return id; }
    public void setId(ConversationMemberId id) { this.id = id; }

    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) { this.conversation = conversation; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }

    public UUID getLastReadMessageId() { return lastReadMessageId; }
    public void setLastReadMessageId(UUID lastReadMessageId) { this.lastReadMessageId = lastReadMessageId; }

    public Instant getMutedUntil() { return mutedUntil; }
    public void setMutedUntil(Instant mutedUntil) { this.mutedUntil = mutedUntil; }
}
