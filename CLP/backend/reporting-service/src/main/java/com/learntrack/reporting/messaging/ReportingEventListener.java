package com.learntrack.reporting.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.common.event.EventEnvelope;
import com.learntrack.reporting.service.ReadModelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumers (group {@code reporting-svc}). Each record value is an
 * {@link EventEnvelope} JSON string (camelCase, default Jackson mapper). We
 * parse the envelope, read tenantId off it (no TenantContext on consumer
 * threads), then delegate to {@link ReadModelService} to update the read model.
 */
@Component
public class ReportingEventListener {

    private static final Logger log = LoggerFactory.getLogger(ReportingEventListener.class);

    private final ReadModelService readModelService;
    private final ObjectMapper objectMapper;

    public ReportingEventListener(ReadModelService readModelService, ObjectMapper objectMapper) {
        this.readModelService = readModelService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "profile.updated", groupId = "${spring.kafka.consumer.group-id}")
    public void onProfileUpdated(String value) {
        dispatch(value, "profile.updated",
                (tenantId, payload) -> readModelService.onProfileUpdated(tenantId, payload));
    }

    @KafkaListener(topics = "risk.detected", groupId = "${spring.kafka.consumer.group-id}")
    public void onRiskDetected(String value) {
        dispatch(value, "risk.detected",
                (tenantId, payload) -> readModelService.onRiskDetected(tenantId, payload));
    }

    @KafkaListener(topics = "risk.review.completed", groupId = "${spring.kafka.consumer.group-id}")
    public void onRiskReviewCompleted(String value) {
        dispatch(value, "risk.review.completed",
                (tenantId, payload) -> readModelService.onRiskReviewCompleted(tenantId, payload));
    }

    @KafkaListener(topics = "risk.resolved", groupId = "${spring.kafka.consumer.group-id}")
    public void onRiskResolved(String value) {
        dispatch(value, "risk.resolved",
                (tenantId, payload) -> readModelService.onRiskResolved(tenantId, payload));
    }

    @KafkaListener(topics = "intervention.assigned", groupId = "${spring.kafka.consumer.group-id}")
    public void onInterventionAssigned(String value) {
        dispatch(value, "intervention.assigned",
                (tenantId, payload) -> readModelService.onInterventionAssigned(tenantId, payload));
    }

    @KafkaListener(topics = "intervention.session.logged", groupId = "${spring.kafka.consumer.group-id}")
    public void onInterventionSessionLogged(String value) {
        dispatch(value, "intervention.session.logged",
                (tenantId, payload) -> readModelService.onInterventionSessionLogged(tenantId, payload));
    }

    @KafkaListener(topics = "intervention.completed", groupId = "${spring.kafka.consumer.group-id}")
    public void onInterventionCompleted(String value) {
        dispatch(value, "intervention.completed",
                (tenantId, payload) -> readModelService.onInterventionCompleted(tenantId, payload));
    }

    @KafkaListener(topics = {"consent.updated", "consent.withdrawn"}, groupId = "${spring.kafka.consumer.group-id}")
    public void onConsentEvent(String value) {
        EventEnvelope env = parse(value);
        if (env == null || !validTenant(env)) {
            return;
        }
        try {
            readModelService.onConsentEvent(env.getEventType(), env.getTenantId(), env.getPayload());
        } catch (Exception e) {
            log.error("Failed handling {}: {}", env.getEventType(), e.getMessage(), e);
        }
    }

    private void dispatch(String value, String eventType, Handler handler) {
        EventEnvelope env = parse(value);
        if (env == null || !validTenant(env)) {
            return;
        }
        try {
            handler.handle(env.getTenantId(), env.getPayload());
        } catch (Exception e) {
            log.error("Failed handling {}: {}", eventType, e.getMessage(), e);
        }
    }

    private boolean validTenant(EventEnvelope env) {
        if (env.getTenantId() == null || env.getTenantId().isBlank()) {
            log.warn("{} ignored: missing tenantId", env.getEventType());
            return false;
        }
        return true;
    }

    private EventEnvelope parse(String value) {
        try {
            return objectMapper.readValue(value, EventEnvelope.class);
        } catch (Exception e) {
            log.warn("Failed to parse event envelope: {}", e.getMessage());
            return null;
        }
    }

    @FunctionalInterface
    private interface Handler {
        void handle(String tenantId, JsonNode payload);
    }
}
