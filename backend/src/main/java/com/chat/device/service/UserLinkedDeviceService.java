package com.chat.device.service;

import com.chat.device.dto.LinkDeviceRequest;
import com.chat.device.dto.UserLinkedDeviceDto;
import com.chat.device.entity.UserLinkedDevice;
import com.chat.device.repository.UserLinkedDeviceRepository;
import com.chat.user.entity.User;
import com.chat.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class UserLinkedDeviceService {

    private final UserLinkedDeviceRepository deviceRepository;
    private final UserRepository userRepository;

    public UserLinkedDeviceService(UserLinkedDeviceRepository deviceRepository, UserRepository userRepository) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<UserLinkedDeviceDto> getUserDevices(UUID userId) {
        List<UserLinkedDevice> list = deviceRepository.findByUserIdOrderByLastActiveAtDesc(userId);
        if (list.isEmpty()) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            // Initialize default active session for this user
            UserLinkedDevice current = new UserLinkedDevice(
                user,
                "Google Chrome (Linux)",
                "linux",
                "Chrome 124.0",
                "Pune, India",
                "192.168.1.104",
                true
            );
            deviceRepository.save(current);
            list = List.of(current);
        }
        return list.stream().map(UserLinkedDeviceDto::fromEntity).toList();
    }

    @Transactional
    public UserLinkedDeviceDto linkDevice(UUID userId, LinkDeviceRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String name = request.deviceName() != null ? request.deviceName() : "New Device";
        String platform = request.platform() != null ? request.platform() : "web";
        String browser = request.browser() != null ? request.browser() : "Browser Session";
        String location = request.location() != null ? request.location() : "Pune, India";
        String ip = request.ipAddress() != null ? request.ipAddress() : "192.168.1.150";

        UserLinkedDevice device = new UserLinkedDevice(user, name, platform, browser, location, ip, false);
        UserLinkedDevice saved = deviceRepository.save(device);
        return UserLinkedDeviceDto.fromEntity(saved);
    }

    @Transactional
    public void removeDevice(UUID userId, UUID deviceId) {
        deviceRepository.deleteByIdAndUserId(deviceId, userId);
    }

    @Transactional
    public void removeAllOtherDevices(UUID userId) {
        deviceRepository.deleteOtherDevicesByUserId(userId);
    }
}
