package com.chat.notification.entity;

import com.chat.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "device_tokens", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "token"})
})
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 512)
    private String token;

    @Column(nullable = false, length = 32)
    private String platform = "WEB";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public DeviceToken() {}

    public DeviceToken(User user, String token, String platform) {
        this.user = user;
        this.token = token;
        this.platform = platform != null ? platform.toUpperCase() : "WEB";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform != null ? platform.toUpperCase() : "WEB"; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
