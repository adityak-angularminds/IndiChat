package com.chat.settings.dto;

import java.util.List;

public record UpdateSettingsRequest(
    Boolean passkeyEnabled,
    Boolean twoFactorEnabled,
    String twoFactorPin,
    Boolean securityNotifications,
    String statusAbout,
    String privacyLastSeen,
    String privacyOnline,
    String privacyProfilePhoto,
    String privacyLinks,
    String privacyStatus,
    List<String> privacyExcludedContacts,
    Boolean readReceipts,
    Boolean enterIsSend,
    Boolean mediaVisibility,
    String fontSize,
    String language
) {}
