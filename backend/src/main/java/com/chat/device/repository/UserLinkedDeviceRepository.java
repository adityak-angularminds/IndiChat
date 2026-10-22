package com.chat.device.repository;

import com.chat.device.entity.UserLinkedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserLinkedDeviceRepository extends JpaRepository<UserLinkedDevice, UUID> {
    List<UserLinkedDevice> findByUserIdOrderByLastActiveAtDesc(UUID userId);

    Optional<UserLinkedDevice> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("DELETE FROM UserLinkedDevice d WHERE d.user.id = :userId AND d.id <> :currentDeviceId")
    void deleteByUserIdAndIdNot(@Param("userId") UUID userId, @Param("currentDeviceId") UUID currentDeviceId);

    @Modifying
    @Query("DELETE FROM UserLinkedDevice d WHERE d.id = :deviceId AND d.user.id = :userId")
    void deleteByIdAndUserId(@Param("deviceId") UUID deviceId, @Param("userId") UUID userId);
}
