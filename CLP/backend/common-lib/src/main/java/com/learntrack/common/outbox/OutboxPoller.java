package com.learntrack.common.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** POC stand-in for Debezium: polls the outbox and publishes to Kafka (topic == eventType). */
@Component
public class OutboxPoller {

    private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);

    private final OutboxRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxPoller(OutboxRepository repository, KafkaTemplate<String, String> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void publishPending() {
        List<OutboxEvent> pending = repository.findTop100ByPublishedAtIsNullOrderByIdAsc();
        for (OutboxEvent e : pending) {
            try {
                kafkaTemplate.send(e.getEventType(), e.getTenantId(), e.getEnvelopeJson()).get();
                e.setPublishedAt(Instant.now());
                repository.save(e);
            } catch (Exception ex) {
                log.warn("Outbox publish failed for id={} type={}: {}", e.getId(), e.getEventType(), ex.getMessage());
                return; // retry on next tick, preserve ordering
            }
        }
    }
}
