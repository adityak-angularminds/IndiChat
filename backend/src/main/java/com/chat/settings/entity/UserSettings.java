package com.chat.settings.entity;

import jakarta.persistence.*;
import org.springframework.data.domain.Persistable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettings implements Persistable<UUID> {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Transient
    private boolean isNew = true;

    @Column(name = "passkey_enabled", nullable = false)
    private boolean passkeyEnabled = false;

    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled = false;

    @Column(name = "two_factor_pin", length = 20)
    private String twoFactorPin;

    @Column(name = "security_notifications", nullable = false)
    private boolean securityNotifications = true;

    @Column(name = "status_about")
    private String statusAbout = "Hey there! I am using IndiChat.";


    @Column(name = "privacy_last_seen", nullable = false, length = 30)
    private String privacyLastSeen = "everyone";

    @Column(name = "privacy_online", nullable = false, length = 30)
    private String privacyOnline = "everyone";

    @Column(name = "privacy_profile_photo", nullable = false, length = 30)
    private String privacyProfilePhoto = "everyone";

    @Column(name = "privacy_links", nullable = false, length = 30)
    private String privacyLinks = "everyone";

    @Column(name = "privacy_status", nullable = false, length = 30)
    private String privacyStatus = "contacts";

    @Column(name = "privacy_excluded_contacts")
    private String privacyExcludedContacts = "";

    @Column(name = "read_receipts", nullable = false)
    private boolean readReceipts = true;

    @Column(name = "enter_is_send", nullable = false)
    private boolean enterIsSend = true;

    @Column(name = "media_visibility", nullable = false)
    private boolean mediaVisibility = true;

    @Column(name = "font_size", nullable = false, length = 20)
    private String fontSize = "medium";

    @Column(name = "language", nullable = false, length = 10)
    private String language = "en";

    @Column(name = "last_backup_at")
    private Instant lastBackupAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserSettings() {}

    public UserSettings(UUID userId) {
        this.userId = userId;
        this.updatedAt = Instant.now();
        this.isNew = true;
    }

    @Override
    public UUID getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public boolean isPasskeyEnabled() { return passkeyEnabled; }
    public void setPasskeyEnabled(boolean passkeyEnabled) { this.passkeyEnabled = passkeyEnabled; }

    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }

    public String getTwoFactorPin() { return twoFactorPin; }
    public void setTwoFactorPin(String twoFactorPin) { this.twoFactorPin = twoFactorPin; }

    public boolean isSecurityNotifications() { return securityNotifications; }
    public void setSecurityNotifications(boolean securityNotifications) { this.securityNotifications = securityNotifications; }

    public String getStatusAbout() { return statusAbout; }
    public void setStatusAbout(String statusAbout) { this.statusAbout = statusAbout; }

    public String getPrivacyLastSeen() { return privacyLastSeen; }
    public void setPrivacyLastSeen(String privacyLastSeen) { this.privacyLastSeen = privacyLastSeen; }

    public String getPrivacyOnline() { return privacyOnline; }
    public void setPrivacyOnline(String privacyOnline) { this.privacyOnline = privacyOnline; }

    public String getPrivacyProfilePhoto() { return privacyProfilePhoto; }
    public void setPrivacyProfilePhoto(String privacyProfilePhoto) { this.privacyProfilePhoto = privacyProfilePhoto; }

    public String getPrivacyLinks() { return privacyLinks; }
    public void setPrivacyLinks(String privacyLinks) { this.privacyLinks = privacyLinks; }

    public String getPrivacyStatus() { return privacyStatus; }
    public void setPrivacyStatus(String privacyStatus) { this.privacyStatus = privacyStatus; }

    public String getPrivacyExcludedContacts() { return privacyExcludedContacts; }
    public void setPrivacyExcludedContacts(String privacyExcludedContacts) { this.privacyExcludedContacts = privacyExcludedContacts; }

    public boolean isReadReceipts() { return readReceipts; }
    public void setReadReceipts(boolean readReceipts) { this.readReceipts = readReceipts; }

    public boolean isEnterIsSend() { return enterIsSend; }
    public void setEnterIsSend(boolean enterIsSend) { this.enterIsSend = enterIsSend; }

    public boolean isMediaVisibility() { return mediaVisibility; }
    public void setMediaVisibility(boolean mediaVisibility) { this.mediaVisibility = mediaVisibility; }

    public String getFontSize() { return fontSize; }
    public void setFontSize(String fontSize) { this.fontSize = fontSize; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Instant getLastBackupAt() { return lastBackupAt; }
    public void setLastBackupAt(Instant lastBackupAt) { this.lastBackupAt = lastBackupAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
