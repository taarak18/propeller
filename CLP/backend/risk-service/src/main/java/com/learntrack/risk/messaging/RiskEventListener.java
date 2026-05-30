package com.learntrack.risk.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.common.event.EventEnvelope;
import com.learntrack.risk.service.RiskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Kafka consumers (group {@code risk-svc}). Each message value is an {@link EventEnvelope} JSON string. */
@Component
public class RiskEventListener {

    private static final Logger log = LoggerFactory.getLogger(RiskEventListener.class);

    private final RiskService riskService;
    private final ObjectMapper objectMapper;

    public RiskEventListener(RiskService riskService, ObjectMapper objectMapper) {
        this.riskService = riskService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "profile.updated")
    public void onProfileUpdated(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        try {
            riskService.handleProfileUpdated(env.getTenantId(), env.getPayload());
        } catch (Exception e) {
            log.error("Failed handling profile.updated: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "consent.withdrawn")
    public void onConsentWithdrawn(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        try {
            riskService.handleConsent(env.getTenantId(), env.getPayload(), true);
        } catch (Exception e) {
            log.error("Failed handling consent.withdrawn: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "consent.updated")
    public void onConsentUpdated(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        try {
            riskService.handleConsent(env.getTenantId(), env.getPayload(), false);
        } catch (Exception e) {
            log.error("Failed handling consent.updated: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "intervention.completed")
    public void onInterventionCompleted(String value) {
        EventEnvelope env = parse(value);
        if (env == null) {
            return;
        }
        try {
            riskService.handleInterventionCompleted(env.getTenantId(), env.getPayload());
        } catch (Exception e) {
            log.error("Failed handling intervention.completed: {}", e.getMessage(), e);
        }
    }

    private EventEnvelope parse(String value) {
        try {
            return objectMapper.readValue(value, EventEnvelope.class);
        } catch (Exception e) {
            log.error("Failed to parse event envelope: {}", e.getMessage());
            return null;
        }
    }
}
