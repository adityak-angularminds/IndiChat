package com.chat.notification.repository;

import com.chat.notification.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {

    List<DeviceToken> findByUserId(UUID userId);

    List<DeviceToken> findByUserIdIn(Collection<UUID> userIds);

    Optional<DeviceToken> findByUserIdAndToken(UUID userId, String token);

    void deleteByUserIdAndToken(UUID userId, String token);

    void deleteByToken(String token);
}
