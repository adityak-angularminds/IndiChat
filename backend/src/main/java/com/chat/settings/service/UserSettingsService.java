package com.chat.settings.service;

import com.chat.settings.dto.UpdateSettingsRequest;
import com.chat.settings.dto.UserSettingsDto;
import com.chat.settings.entity.UserSettings;
import com.chat.settings.repository.UserSettingsRepository;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserSettingsService {

    private final UserSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    public UserSettingsService(UserSettingsRepository settingsRepository, UserRepository userRepository) {
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public UserSettingsDto getSettings(UUID userId) {
        UserSettings s = settingsRepository.findById(userId).orElseGet(() -> {
            if (!userRepository.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            UserSettings created = new UserSettings(userId);
            return settingsRepository.save(created);
        });
        return UserSettingsDto.fromEntity(s);
    }

    @Transactional
    public UserSettingsDto updateSettings(UUID userId, UpdateSettingsRequest request) {
        UserSettings s = settingsRepository.findById(userId).orElseGet(() -> {
            if (!userRepository.existsById(userId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            UserSettings created = new UserSettings(userId);
            return settingsRepository.save(created);
        });

        if (request.passkeyEnabled() != null) s.setPasskeyEnabled(request.passkeyEnabled());
        if (request.twoFactorEnabled() != null) s.setTwoFactorEnabled(request.twoFactorEnabled());
        if (request.twoFactorPin() != null) s.setTwoFactorPin(request.twoFactorPin());
        if (request.securityNotifications() != null) s.setSecurityNotifications(request.securityNotifications());
        if (request.statusAbout() != null) s.setStatusAbout(request.statusAbout());
        if (request.privacyLastSeen() != null) s.setPrivacyLastSeen(request.privacyLastSeen());
        if (request.privacyOnline() != null) s.setPrivacyOnline(request.privacyOnline());
        if (request.privacyProfilePhoto() != null) s.setPrivacyProfilePhoto(request.privacyProfilePhoto());
        if (request.privacyLinks() != null) s.setPrivacyLinks(request.privacyLinks());
        if (request.privacyStatus() != null) s.setPrivacyStatus(request.privacyStatus());
        if (request.privacyExcludedContacts() != null) {
            s.setPrivacyExcludedContacts(String.join(",", request.privacyExcludedContacts()));
        }
        if (request.readReceipts() != null) s.setReadReceipts(request.readReceipts());
        if (request.enterIsSend() != null) s.setEnterIsSend(request.enterIsSend());
        if (request.mediaVisibility() != null) s.setMediaVisibility(request.mediaVisibility());
        if (request.fontSize() != null) s.setFontSize(request.fontSize());
        if (request.language() != null) s.setLanguage(request.language());

        s.setUpdatedAt(Instant.now());
        UserSettings saved = settingsRepository.save(s);
        return UserSettingsDto.fromEntity(saved);
    }
}
