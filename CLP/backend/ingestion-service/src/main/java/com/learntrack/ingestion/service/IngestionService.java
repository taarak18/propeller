package com.learntrack.ingestion.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learntrack.common.outbox.OutboxPublisher;
import com.learntrack.common.tenant.TenantContext;
import com.learntrack.ingestion.model.IngestionJob;
import com.learntrack.ingestion.repository.IngestionJobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Stores ingestion jobs (idempotent per tenant) and emits {@code data.ingested}
 * events through the transactional outbox.
 */
@Service
public class IngestionService {

    private final IngestionJobRepository jobRepository;
    private final OutboxPublisher outboxPublisher;
    private final ObjectMapper objectMapper;

    public IngestionService(IngestionJobRepository jobRepository,
                            OutboxPublisher outboxPublisher,
                            ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.outboxPublisher = outboxPublisher;
        this.objectMapper = objectMapper;
    }

    /** Result of an ingest call. {@code alreadyProcessed} is true when the idempotency key was seen before. */
    public record IngestResult(Long jobId, boolean alreadyProcessed) {}

    @Transactional
    public IngestResult ingest(String dataType, String idempotencyKey, List<Map<String, Object>> records) {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant in context");
        }

        Optional<IngestionJob> existing = jobRepository.findByTenantIdAndIdempotencyKey(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            return new IngestResult(existing.get().getId(), true);
        }

        List<Map<String, Object>> safeRecords = records == null ? List.of() : records;

        IngestionJob job = new IngestionJob();
        job.setTenantId(tenantId);
        job.setIdempotencyKey(idempotencyKey);
        job.setDataType(dataType);
        job.setRecordCount(safeRecords.size());
        job.setStatus("COMPLETED");
        job = jobRepository.save(job);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("dataType", dataType);
        payload.put("jobId", job.getId());

        ArrayNode employeeIds = payload.putArray("employeeIds");
        Set<String> distinctIds = new LinkedHashSet<>();
        for (Map<String, Object> record : safeRecords) {
            Object empId = record.get("employeeId");
            if (empId != null) {
                distinctIds.add(String.valueOf(empId));
            }
        }
        distinctIds.forEach(employeeIds::add);

        payload.set("records", objectMapper.valueToTree(safeRecords));

        outboxPublisher.enqueue("data.ingested", tenantId, payload);

        return new IngestResult(job.getId(), false);
    }

    @Transactional(readOnly = true)
    public List<IngestionJob> recentJobs() {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant in context");
        }
        return jobRepository.findTop50ByTenantIdOrderByCreatedAtDesc(tenantId);
    }
}
