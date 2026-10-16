package com.chat.contact.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ContactId implements Serializable {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "contact_user_id")
    private UUID contactUserId;

    public ContactId() {}

    public ContactId(UUID userId, UUID contactUserId) {
        this.userId = userId;
        this.contactUserId = contactUserId;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getContactUserId() { return contactUserId; }
    public void setContactUserId(UUID contactUserId) { this.contactUserId = contactUserId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ContactId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(contactUserId, that.contactUserId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, contactUserId);
    }
}
