package com.chat.presence;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);
    private static final String PRESENCE_KEY_PREFIX = "presence:user:";

    private final StringRedisTemplate redisTemplate;
    private final Set<UUID> localPresence = ConcurrentHashMap.newKeySet();

    public PresenceService(@Autowired(required = false) org.springframework.beans.factory.ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider != null ? redisTemplateProvider.getIfAvailable() : null;
    }

    public void setUserOnline(UUID userId) {
        localPresence.add(userId);
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + userId, "ONLINE", Duration.ofMinutes(5));
            } catch (Exception e) {
                log.warn("Redis presence update failed: {}", e.getMessage());
            }
        }
    }

    public void setUserOffline(UUID userId) {
        localPresence.remove(userId);
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(PRESENCE_KEY_PREFIX + userId);
            } catch (Exception e) {
                log.warn("Redis presence remove failed: {}", e.getMessage());
            }
        }
    }

    public boolean isUserOnline(UUID userId) {
        if (localPresence.contains(userId)) {
            return true;
        }
        if (redisTemplate != null) {
            try {
                Boolean exists = redisTemplate.hasKey(PRESENCE_KEY_PREFIX + userId);
                return Boolean.TRUE.equals(exists);
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }
}
