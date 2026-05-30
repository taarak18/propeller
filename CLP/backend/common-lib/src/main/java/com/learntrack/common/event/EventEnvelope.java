package com.learntrack.common.event;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** Standard Kafka event envelope (see CONTRACTS.md §3). */
public class EventEnvelope {
    private String eventId;
    private String eventType;
    private String eventVersion = "v1";
    private String tenantId;
    private String sourceService;
    private String timestamp;
    private String correlationId;
    private JsonNode payload;

    public EventEnvelope() {
    }

    public static EventEnvelope of(String eventType, String tenantId, String sourceService, JsonNode payload) {
        EventEnvelope e = new EventEnvelope();
        e.eventId = UUID.randomUUID().toString();
        e.eventType = eventType;
        e.eventVersion = "v1";
        e.tenantId = tenantId;
        e.sourceService = sourceService;
        e.timestamp = Instant.now().toString();
        e.correlationId = UUID.randomUUID().toString();
        e.payload = payload;
        return e;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventVersion() { return eventVersion; }
    public void setEventVersion(String eventVersion) { this.eventVersion = eventVersion; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getSourceService() { return sourceService; }
    public void setSourceService(String sourceService) { this.sourceService = sourceService; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    public JsonNode getPayload() { return payload; }
    public void setPayload(JsonNode payload) { this.payload = payload; }
}
