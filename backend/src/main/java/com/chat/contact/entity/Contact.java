package com.chat.contact.entity;

import com.chat.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "contacts")
public class Contact {

    @EmbeddedId
    private ContactId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("contactUserId")
    @JoinColumn(name = "contact_user_id")
    private User contactUser;

    @Column(length = 100)
    private String nickname;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Contact() {}

    public Contact(User user, User contactUser, String nickname) {
        this.id = new ContactId(user.getId(), contactUser.getId());
        this.user = user;
        this.contactUser = contactUser;
        this.nickname = nickname;
        this.createdAt = Instant.now();
    }

    public ContactId getId() { return id; }
    public void setId(ContactId id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public User getContactUser() { return contactUser; }
    public void setContactUser(User contactUser) { this.contactUser = contactUser; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
