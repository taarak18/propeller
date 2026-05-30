package com.learntrack.ingestion.web;

import com.learntrack.ingestion.model.IngestionJob;
import com.learntrack.ingestion.service.IngestionService;
import com.learntrack.ingestion.service.IngestionService.IngestResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingest")
public class IngestController {

    private final IngestionService ingestionService;

    public IngestController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/training-attendance")
    public ResponseEntity<Map<String, Object>> ingestTrainingAttendance(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody IngestRequest request) {
        return handle("training-attendance", idempotencyKey, request);
    }

    @PostMapping("/assessments")
    public ResponseEntity<Map<String, Object>> ingestAssessments(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody IngestRequest request) {
        return handle("assessments", idempotencyKey, request);
    }

    @PostMapping("/competency-milestones")
    public ResponseEntity<Map<String, Object>> ingestCompetencyMilestones(
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody IngestRequest request) {
        return handle("competency-milestones", idempotencyKey, request);
    }

    @GetMapping("/jobs")
    public List<Map<String, Object>> recentJobs() {
        List<IngestionJob> jobs = ingestionService.recentJobs();
        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (IngestionJob j : jobs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("jobId", j.getId());
            m.put("dataType", j.getDataType());
            m.put("recordCount", j.getRecordCount());
            m.put("status", j.getStatus());
            m.put("idempotencyKey", j.getIdempotencyKey());
            m.put("createdAt", j.getCreatedAt());
            out.add(m);
        }
        return out;
    }

    private ResponseEntity<Map<String, Object>> handle(String dataType, String idempotencyKey, IngestRequest request) {
        String key = (idempotencyKey == null || idempotencyKey.isBlank())
                ? UUID.randomUUID().toString()
                : idempotencyKey;
        IngestResult result = ingestionService.ingest(
                dataType, key, request == null ? null : request.getRecords());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", result.jobId());
        if (result.alreadyProcessed()) {
            body.put("alreadyProcessed", true);
            return ResponseEntity.status(HttpStatus.OK).body(body);
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }
}
