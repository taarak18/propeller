package com.learntrack.common.outbox;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.common.event.EventEnvelope;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Call {@link #enqueue} inside the same DB transaction as the domain write. */
@Service
public class OutboxPublisher {

    private final OutboxRepository repository;
    private final ObjectMapper objectMapper;
    private final String sourceService;

    public OutboxPublisher(OutboxRepository repository,
                           ObjectMapper objectMapper,
                           @Value("${spring.application.name:unknown-service}") String sourceService) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.sourceService = sourceService;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(String eventType, String tenantId, JsonNode payload) {
        try {
            EventEnvelope env = EventEnvelope.of(eventType, tenantId, sourceService, payload);
            OutboxEvent row = new OutboxEvent();
            row.setTenantId(tenantId);
            row.setEventType(eventType);
            row.setEnvelopeJson(objectMapper.writeValueAsString(env));
            repository.save(row);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to enqueue outbox event " + eventType, e);
        }
    }
}
