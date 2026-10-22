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

import java.time.Instant;
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

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public UserLinkedDevice registerOrUpdateDevice(
        User user,
        UUID deviceId,
        String deviceName,
        String platform,
        String browser,
        String ipAddress
    ) {
        if (deviceId == null) {
            deviceId = UUID.randomUUID();
        }
        UserLinkedDevice device = deviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            device = new UserLinkedDevice();
            device.setId(deviceId);
            device.setUser(user);
            device.setCreatedAt(Instant.now());
        } else {
            device.setUser(user);
        }

        if (deviceName != null && !deviceName.isBlank()) {
            device.setDeviceName(deviceName.trim());
        } else if (device.getDeviceName() == null) {
            device.setDeviceName("Web Browser");
        }

        if (platform != null && !platform.isBlank()) {
            device.setPlatform(platform.trim().toLowerCase());
        } else if (device.getPlatform() == null) {
            device.setPlatform("web");
        }

        if (browser != null && !browser.isBlank()) {
            device.setBrowser(browser.trim());
        } else if (device.getBrowser() == null) {
            device.setBrowser("Browser Session");
        }

        if (device.getLocation() == null || device.getLocation().isBlank()) {
            device.setLocation("Pune, India");
        }

        if (ipAddress != null && !ipAddress.isBlank()) {
            device.setIpAddress(ipAddress.trim());
        } else if (device.getIpAddress() == null) {
            device.setIpAddress("192.168.1.100");
        }

        device.setLastActiveAt(Instant.now());
        return deviceRepository.save(device);
    }

    @Transactional
    public List<UserLinkedDeviceDto> getUserDevices(
        UUID userId,
        UUID currentDeviceId,
        String deviceName,
        String platform,
        String browser,
        String ipAddress
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (currentDeviceId != null) {
            registerOrUpdateDevice(user, currentDeviceId, deviceName, platform, browser, ipAddress);
        }

        List<UserLinkedDevice> list = deviceRepository.findByUserIdOrderByLastActiveAtDesc(userId);
        if (list.isEmpty()) {
            UUID idToUse = currentDeviceId != null ? currentDeviceId : UUID.randomUUID();
            UserLinkedDevice current = registerOrUpdateDevice(
                user,
                idToUse,
                deviceName != null ? deviceName : "Google Chrome (Linux)",
                platform != null ? platform : "linux",
                browser != null ? browser : "Chrome 124.0",
                ipAddress != null ? ipAddress : "192.168.1.104"
            );
            list = List.of(current);
        }

        final UUID activeId = currentDeviceId != null ? currentDeviceId : list.get(0).getId();
        return list.stream()
            .map(d -> UserLinkedDeviceDto.fromEntity(d, d.getId().equals(activeId)))
            .toList();
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
        return UserLinkedDeviceDto.fromEntity(saved, false);
    }

    @Transactional
    public void removeDevice(UUID userId, UUID deviceId) {
        deviceRepository.deleteByIdAndUserId(deviceId, userId);
    }

    @Transactional
    public void removeAllOtherDevices(UUID userId, UUID currentDeviceId) {
        if (currentDeviceId != null) {
            deviceRepository.deleteByUserIdAndIdNot(userId, currentDeviceId);
        } else {
            List<UserLinkedDevice> list = deviceRepository.findByUserIdOrderByLastActiveAtDesc(userId);
            if (!list.isEmpty()) {
                deviceRepository.deleteByUserIdAndIdNot(userId, list.get(0).getId());
            }
        }
    }
}
