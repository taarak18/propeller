package com.learntrack.profile.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.common.event.EventEnvelope;
import com.learntrack.profile.service.ProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes learning-data and consent events. The Kafka record value is the
 * JSON {@link EventEnvelope}; we parse it, validate the tenant, then delegate.
 */
@Component
public class ProfileEventListener {

    private static final Logger log = LoggerFactory.getLogger(ProfileEventListener.class);

    private final ProfileService profileService;
    private final ObjectMapper objectMapper;

    public ProfileEventListener(ProfileService profileService, ObjectMapper objectMapper) {
        this.profileService = profileService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "data.ingested", groupId = "${spring.kafka.consumer.group-id}")
    public void onDataIngested(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        String tenantId = env.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("data.ingested ignored: missing tenantId");
            return;
        }
        JsonNode payload = env.getPayload();
        if (payload == null) {
            log.warn("data.ingested ignored: missing payload for tenant {}", tenantId);
            return;
        }
        profileService.applyDataIngested(tenantId, payload);
    }

    @KafkaListener(topics = {"consent.withdrawn", "consent.updated"}, groupId = "${spring.kafka.consumer.group-id}")
    public void onConsentEvent(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        String tenantId = env.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("consent event ignored: missing tenantId");
            return;
        }
        JsonNode payload = env.getPayload();
        if (payload == null) {
            log.warn("consent event ignored: missing payload for tenant {}", tenantId);
            return;
        }
        profileService.applyConsentEvent(env.getEventType(), tenantId, payload);
    }

    private EventEnvelope parse(String value) {
        try {
            return objectMapper.readValue(value, EventEnvelope.class);
        } catch (Exception e) {
            log.warn("Failed to parse event envelope: {}", e.getMessage());
            return null;
        }
    }
}
