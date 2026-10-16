package com.chat.receipt.entity;

import com.chat.message.entity.Message;
import com.chat.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "message_receipts")
public class MessageReceipt {

    @EmbeddedId
    private MessageReceiptId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("messageId")
    @JoinColumn(name = "message_id")
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "read_at")
    private Instant readAt;

    public MessageReceipt() {}

    public MessageReceipt(Message message, User user) {
        this.id = new MessageReceiptId(message.getId(), user.getId());
        this.message = message;
        this.user = user;
    }

    public MessageReceiptId getId() { return id; }
    public void setId(MessageReceiptId id) { this.id = id; }

    public Message getMessage() { return message; }
    public void setMessage(Message message) { this.message = message; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
