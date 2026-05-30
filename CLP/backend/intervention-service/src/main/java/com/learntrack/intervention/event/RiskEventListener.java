package com.learntrack.intervention.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.common.event.EventEnvelope;
import com.learntrack.intervention.service.InterventionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/** Consumes risk.detected and auto-creates a RECOMMENDED intervention. */
@Component
public class RiskEventListener {

    private static final Logger log = LoggerFactory.getLogger(RiskEventListener.class);

    private final InterventionService service;
    private final ObjectMapper objectMapper;

    public RiskEventListener(InterventionService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "risk.detected")
    public void onRiskDetected(String value) {
        try {
            EventEnvelope env = objectMapper.readValue(value, EventEnvelope.class);
            String tenantId = env.getTenantId();
            JsonNode payload = env.getPayload();
            if (tenantId == null || payload == null) {
                log.warn("Ignoring risk.detected with missing tenantId/payload");
                return;
            }

            String employeeId = text(payload, "employeeId");
            if (employeeId == null) {
                log.warn("Ignoring risk.detected with no employeeId for tenant={}", tenantId);
                return;
            }
            String employeeName = text(payload, "employeeName");
            String riskId = text(payload, "riskId");

            String recommendedType = "GENERAL_SUPPORT";
            JsonNode recommended = payload.get("recommendedInterventions");
            if (recommended != null && recommended.isArray() && recommended.size() > 0) {
                recommendedType = recommended.get(0).asText(recommendedType);
            }

            service.autoCreateFromRisk(tenantId, employeeId, employeeName, riskId, recommendedType);
        } catch (Exception e) {
            log.error("Failed to process risk.detected event: {}", e.getMessage(), e);
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
