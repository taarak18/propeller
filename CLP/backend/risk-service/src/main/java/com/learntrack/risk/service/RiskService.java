package com.learntrack.risk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learntrack.common.outbox.OutboxPublisher;
import com.learntrack.risk.domain.EmployeeOptOut;
import com.learntrack.risk.domain.RiskAssessment;
import com.learntrack.risk.domain.RiskReview;
import com.learntrack.risk.domain.RiskRule;
import com.learntrack.risk.engine.EvaluationResult;
import com.learntrack.risk.engine.RuleEngine;
import com.learntrack.risk.repository.EmployeeOptOutRepository;
import com.learntrack.risk.repository.RiskAssessmentRepository;
import com.learntrack.risk.repository.RiskReviewRepository;
import com.learntrack.risk.repository.RiskRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Core risk-assessment logic: event handling, reviews, and read queries. */
@Service
public class RiskService {

    private static final Logger log = LoggerFactory.getLogger(RiskService.class);

    private final RiskRuleRepository ruleRepository;
    private final RiskAssessmentRepository assessmentRepository;
    private final RiskReviewRepository reviewRepository;
    private final EmployeeOptOutRepository optOutRepository;
    private final RuleEngine ruleEngine;
    private final OutboxPublisher outboxPublisher;
    private final ObjectMapper objectMapper;

    public RiskService(RiskRuleRepository ruleRepository,
                       RiskAssessmentRepository assessmentRepository,
                       RiskReviewRepository reviewRepository,
                       EmployeeOptOutRepository optOutRepository,
                       RuleEngine ruleEngine,
                       OutboxPublisher outboxPublisher,
                       ObjectMapper objectMapper) {
        this.ruleRepository = ruleRepository;
        this.assessmentRepository = assessmentRepository;
        this.reviewRepository = reviewRepository;
        this.optOutRepository = optOutRepository;
        this.ruleEngine = ruleEngine;
        this.outboxPublisher = outboxPublisher;
        this.objectMapper = objectMapper;
    }

    // ---------------------------------------------------------------------
    // Event handling
    // ---------------------------------------------------------------------

    /** Consume {@code profile.updated}: evaluate rules (honouring opt-out) and upsert the assessment. */
    @Transactional
    public void handleProfileUpdated(String tenantId, JsonNode payload) {
        if (tenantId == null || payload == null) {
            return;
        }
        String employeeId = payload.path("employeeId").asText(null);
        if (employeeId == null) {
            return;
        }
        String employeeName = payload.path("employeeName").asText(null);
        String department = payload.path("department").asText(null);
        boolean payloadOptOut = payload.path("riskProfilingOptOut").asBoolean(false);
        boolean cachedOptOut = optOutRepository.existsByTenantIdAndEmployeeIdAndOptedOutTrue(tenantId, employeeId);

        if (payloadOptOut || cachedOptOut) {
            log.info("suppressed risk profiling for {} (opt-out)", employeeId);
            assessmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId).ifPresent(existing -> {
                if (!"RESOLVED".equals(existing.getStatus())) {
                    boolean wasAtRisk = !"NONE".equals(existing.getRiskLevel());
                    resolveAssessment(tenantId, existing, wasAtRisk);
                }
            });
            return;
        }

        JsonNode snapshot = payload.path("snapshot");
        List<RiskRule> activeRules = ruleRepository.findByTenantIdAndActiveTrue(tenantId);
        EvaluationResult result = ruleEngine.evaluate(activeRules, snapshot);
        boolean atRisk = !"NONE".equals(result.getRiskLevel());

        Optional<RiskAssessment> existingOpt = assessmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);

        if (!atRisk) {
            // No rule matched. De-risk a previously at-risk row (and notify downstream); otherwise do nothing.
            existingOpt.ifPresent(existing -> {
                boolean wasAtRisk = !"RESOLVED".equals(existing.getStatus()) && !"NONE".equals(existing.getRiskLevel());
                if (wasAtRisk) {
                    resolveAssessment(tenantId, existing, true);
                }
            });
            return;
        }

        Instant now = Instant.now();
        RiskAssessment assessment = existingOpt.orElseGet(RiskAssessment::new);
        boolean isNew = assessment.getRiskId() == null;
        if (isNew) {
            assessment.setTenantId(tenantId);
            assessment.setEmployeeId(employeeId);
            assessment.setCreatedAt(now);
        }
        assessment.setEmployeeName(employeeName);
        assessment.setDepartment(department);
        assessment.setAssessmentDate(now);
        assessment.setRiskLevel(result.getRiskLevel());
        assessment.setRiskScore(result.getScore());
        assessment.setTrigger(result.getTrigger());
        assessment.setMetric(result.getMetric());
        assessment.setThreshold(result.getThreshold());
        assessment.setRiskFactorsJson(writeJson(result.getRiskFactors()));
        assessment.setRulesTriggeredJson(writeJson(result.ruleIds()));
        assessment.setRecommendedInterventionsJson(writeJson(List.of("remedial_training")));
        assessment.setUpdatedAt(now);

        boolean requiresReview = "CRITICAL".equals(result.getRiskLevel()) || "HIGH".equals(result.getRiskLevel());
        assessment.setStatus("ACTIVE");
        assessment.setRequiresHumanReview(requiresReview);

        if (requiresReview) {
            assessment.setReviewStatus("PENDING");
        } else if (assessment.getReviewStatus() == null) {
            assessment.setReviewStatus("NONE");
        }

        assessment = assessmentRepository.save(assessment);

        if (requiresReview
                && !reviewRepository.existsByTenantIdAndRiskIdAndDecision(tenantId, assessment.getRiskId(), "PENDING")) {
            RiskReview review = new RiskReview();
            review.setTenantId(tenantId);
            review.setRiskId(assessment.getRiskId());
            review.setDecision("PENDING");
            reviewRepository.save(review);
            log.info("employee notification withheld for {} pending human review (riskLevel={})",
                    employeeId, result.getRiskLevel());
        }

        publishRiskDetected(tenantId, assessment, result);
    }

    /** Transition an assessment to RESOLVED, dismiss any PENDING review, and (optionally) emit risk.resolved. */
    private void resolveAssessment(String tenantId, RiskAssessment assessment, boolean publish) {
        assessment.setStatus("RESOLVED");
        assessment.setRiskLevel("NONE");
        assessment.setRequiresHumanReview(false);
        assessment.setReviewStatus("NONE");
        assessment.setUpdatedAt(Instant.now());
        assessmentRepository.save(assessment);

        for (RiskReview r : reviewRepository.findByTenantIdAndRiskIdOrderByReviewIdAsc(tenantId, assessment.getRiskId())) {
            if ("PENDING".equals(r.getDecision())) {
                r.setDecision("DISMISSED");
                r.setReviewedAt(Instant.now());
                reviewRepository.save(r);
            }
        }

        if (publish) {
            ObjectNode resolved = objectMapper.createObjectNode();
            resolved.put("riskId", assessment.getRiskId());
            resolved.put("employeeId", assessment.getEmployeeId());
            outboxPublisher.enqueue("risk.resolved", tenantId, resolved);
            log.info("risk resolved for {} (de-risked)", assessment.getEmployeeId());
        }
    }

    private void publishRiskDetected(String tenantId, RiskAssessment a, EvaluationResult result) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("riskId", a.getRiskId());
        payload.put("employeeId", a.getEmployeeId());
        payload.put("employeeName", a.getEmployeeName());
        payload.put("department", a.getDepartment());
        payload.put("riskLevel", a.getRiskLevel());
        payload.put("riskScore", a.getRiskScore());
        payload.put("trigger", a.getTrigger());
        payload.put("metric", a.getMetric());
        payload.put("threshold", a.getThreshold());
        payload.set("riskFactors", toArrayNode(result.getRiskFactors()));
        payload.set("rulesTriggered", toArrayNode(result.ruleIds()));
        payload.put("requiresHumanReview", a.isRequiresHumanReview());
        ArrayNode interventions = objectMapper.createArrayNode();
        interventions.add("remedial_training");
        payload.set("recommendedInterventions", interventions);
        outboxPublisher.enqueue("risk.detected", tenantId, payload);
    }

    /** Consume {@code consent.withdrawn} / {@code consent.updated}: maintain the opt-out cache. */
    @Transactional
    public void handleConsent(String tenantId, JsonNode payload, boolean withdrawn) {
        if (tenantId == null || payload == null) {
            return;
        }
        String purpose = payload.path("purpose").asText(null);
        if (!"risk_profiling".equals(purpose)) {
            return;
        }
        String employeeId = payload.path("employeeId").asText(null);
        if (employeeId == null) {
            return;
        }
        boolean optedOut;
        if (withdrawn) {
            optedOut = payload.path("riskProfilingOptOut").asBoolean(true);
        } else {
            String status = payload.path("status").asText("");
            optedOut = !(status.equalsIgnoreCase("GRANT")
                    || status.equalsIgnoreCase("GRANTED")
                    || status.equalsIgnoreCase("ACTIVE")
                    || status.equalsIgnoreCase("active"));
        }

        EmployeeOptOut row = optOutRepository.findByTenantIdAndEmployeeId(tenantId, employeeId)
                .orElseGet(EmployeeOptOut::new);
        row.setTenantId(tenantId);
        row.setEmployeeId(employeeId);
        row.setOptedOut(optedOut);
        row.setUpdatedAt(Instant.now());
        optOutRepository.save(row);
        log.info("opt-out cache updated: {} risk_profiling optedOut={}", employeeId, optedOut);
    }

    /** Consume {@code intervention.completed}: resolve the latest assessment and emit {@code risk.resolved}. */
    @Transactional
    public void handleInterventionCompleted(String tenantId, JsonNode payload) {
        if (tenantId == null || payload == null) {
            return;
        }
        String employeeId = payload.path("employeeId").asText(null);
        if (employeeId == null) {
            return;
        }
        assessmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId).ifPresent(assessment -> {
            if (!"RESOLVED".equals(assessment.getStatus())) {
                resolveAssessment(tenantId, assessment, true);
                log.info("risk resolved for {} after intervention completion", employeeId);
            }
        });
    }

    // ---------------------------------------------------------------------
    // REST-facing queries
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAtRisk(String tenantId, String riskLevel, String dept, String trigger) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RiskAssessment a : assessmentRepository.findByTenantIdAndStatus(tenantId, "ACTIVE")) {
            if ("NONE".equals(a.getRiskLevel())) {
                continue;
            }
            if (riskLevel != null && !riskLevel.isBlank() && !riskLevel.equalsIgnoreCase(a.getRiskLevel())) {
                continue;
            }
            if (dept != null && !dept.isBlank() && !dept.equalsIgnoreCase(a.getDepartment())) {
                continue;
            }
            if (trigger != null && !trigger.isBlank()
                    && (a.getTrigger() == null || !a.getTrigger().toLowerCase().contains(trigger.toLowerCase()))) {
                continue;
            }
            out.add(toListItem(a));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDetail(String tenantId, Long riskId) {
        RiskAssessment a = assessmentRepository.findByRiskIdAndTenantId(riskId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Risk assessment not found"));
        Map<String, Object> detail = toListItem(a);
        detail.put("riskScore", a.getRiskScore());
        detail.put("status", a.getStatus());
        detail.put("assessmentDate", a.getAssessmentDate());
        detail.put("riskFactors", readJsonArray(a.getRiskFactorsJson()));
        detail.put("rulesTriggered", readJsonArray(a.getRulesTriggeredJson()));
        detail.put("recommendedInterventions", readJsonArray(a.getRecommendedInterventionsJson()));

        List<Map<String, Object>> reviews = new ArrayList<>();
        for (RiskReview r : reviewRepository.findByTenantIdAndRiskIdOrderByReviewIdAsc(tenantId, riskId)) {
            Map<String, Object> rv = new LinkedHashMap<>();
            rv.put("reviewId", r.getReviewId());
            rv.put("reviewerId", r.getReviewerId());
            rv.put("reviewerRole", r.getReviewerRole());
            rv.put("decision", r.getDecision());
            rv.put("notes", r.getNotes());
            rv.put("reviewedAt", r.getReviewedAt());
            reviews.add(rv);
        }
        detail.put("reviews", reviews);
        return detail;
    }

    @Transactional
    public Map<String, Object> review(String tenantId, Long riskId, String reviewerId, String reviewerRole,
                                      String decision, String newRiskLevel, String notes) {
        RiskAssessment a = assessmentRepository.findByRiskIdAndTenantId(riskId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Risk assessment not found"));
        if (decision == null
                || !List.of("CONFIRMED", "OVERRIDDEN", "DISMISSED").contains(decision.toUpperCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid decision");
        }
        String normalized = decision.toUpperCase();

        RiskReview review = reviewRepository.findByTenantIdAndRiskIdOrderByReviewIdAsc(tenantId, riskId).stream()
                .filter(r -> "PENDING".equals(r.getDecision()))
                .findFirst()
                .orElseGet(RiskReview::new);
        review.setTenantId(tenantId);
        review.setRiskId(riskId);
        review.setReviewerId(reviewerId);
        review.setReviewerRole(reviewerRole);
        review.setDecision(normalized);
        review.setNotes(notes);
        review.setReviewedAt(Instant.now());
        reviewRepository.save(review);

        a.setReviewStatus(normalized);
        if ("OVERRIDDEN".equals(normalized) && newRiskLevel != null && !newRiskLevel.isBlank()) {
            a.setRiskLevel(newRiskLevel.toUpperCase());
        }
        if ("DISMISSED".equals(normalized)) {
            a.setStatus("RESOLVED");
        }
        a.setRequiresHumanReview(false);
        a.setUpdatedAt(Instant.now());
        assessmentRepository.save(a);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("riskId", riskId);
        payload.put("employeeId", a.getEmployeeId());
        payload.put("decision", normalized);
        payload.put("finalRiskLevel", a.getRiskLevel());
        outboxPublisher.enqueue("risk.review.completed", tenantId, payload);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("riskId", riskId);
        resp.put("decision", normalized);
        resp.put("finalRiskLevel", a.getRiskLevel());
        resp.put("reviewStatus", a.getReviewStatus());
        return resp;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summary(String tenantId) {
        int critical = 0;
        int high = 0;
        int medium = 0;
        int low = 0;
        int pendingReviews = 0;
        for (RiskAssessment a : assessmentRepository.findByTenantIdAndStatus(tenantId, "ACTIVE")) {
            String level = a.getRiskLevel() == null ? "" : a.getRiskLevel();
            switch (level) {
                case "CRITICAL" -> critical++;
                case "HIGH" -> high++;
                case "MEDIUM" -> medium++;
                case "LOW" -> low++;
                default -> {
                }
            }
            if (("CRITICAL".equals(level) || "HIGH".equals(level)) && "PENDING".equals(a.getReviewStatus())) {
                pendingReviews++;
            }
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("critical", critical);
        summary.put("high", high);
        summary.put("medium", medium);
        summary.put("low", low);
        summary.put("pendingReviews", pendingReviews);
        return summary;
    }

    private Map<String, Object> toListItem(RiskAssessment a) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("riskId", a.getRiskId());
        item.put("employeeId", a.getEmployeeId());
        item.put("employeeName", a.getEmployeeName());
        item.put("department", a.getDepartment());
        item.put("riskLevel", a.getRiskLevel());
        item.put("riskScore", a.getRiskScore());
        item.put("trigger", a.getTrigger());
        item.put("metric", a.getMetric());
        item.put("threshold", a.getThreshold());
        item.put("requiresHumanReview", a.isRequiresHumanReview());
        item.put("reviewStatus", a.getReviewStatus());
        return item;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<Object> readJsonArray(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<Object>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private ArrayNode toArrayNode(List<String> values) {
        ArrayNode node = objectMapper.createArrayNode();
        for (String v : values) {
            node.add(v);
        }
        return node;
    }
}
