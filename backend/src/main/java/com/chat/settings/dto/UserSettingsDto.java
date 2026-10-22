package com.chat.settings.dto;

import com.chat.settings.entity.UserSettings;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record UserSettingsDto(
    UUID userId,
    boolean passkeyEnabled,
    boolean twoFactorEnabled,
    boolean securityNotifications,
    String statusAbout,
    String privacyLastSeen,
    String privacyOnline,
    String privacyProfilePhoto,
    String privacyLinks,
    String privacyStatus,
    List<String> privacyExcludedContacts,
    boolean readReceipts,
    boolean enterIsSend,
    boolean mediaVisibility,
    String fontSize,
    String language,
    Instant lastBackupAt,
    Instant updatedAt
) {
    public static UserSettingsDto fromEntity(UserSettings s) {
        List<String> excluded = (s.getPrivacyExcludedContacts() == null || s.getPrivacyExcludedContacts().isBlank())
            ? List.of()
            : Arrays.stream(s.getPrivacyExcludedContacts().split(","))
                .map(String::trim)
                .filter(x -> !x.isEmpty())
                .toList();

        return new UserSettingsDto(
            s.getUserId(),
            s.isPasskeyEnabled(),
            s.isTwoFactorEnabled(),
            s.isSecurityNotifications(),
            s.getStatusAbout(),
            s.getPrivacyLastSeen(),
            s.getPrivacyOnline(),
            s.getPrivacyProfilePhoto(),
            s.getPrivacyLinks(),
            s.getPrivacyStatus(),
            excluded,
            s.isReadReceipts(),
            s.isEnterIsSend(),
            s.isMediaVisibility(),
            s.getFontSize(),
            s.getLanguage(),
            s.getLastBackupAt(),
            s.getUpdatedAt()
        );
    }
}
