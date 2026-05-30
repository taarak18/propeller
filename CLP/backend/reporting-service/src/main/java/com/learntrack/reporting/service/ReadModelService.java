package com.learntrack.reporting.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.learntrack.reporting.domain.AlertItem;
import com.learntrack.reporting.domain.EmployeeReadModel;
import com.learntrack.reporting.domain.InterventionReadModel;
import com.learntrack.reporting.repository.AlertItemRepository;
import com.learntrack.reporting.repository.EmployeeReadModelRepository;
import com.learntrack.reporting.repository.InterventionReadModelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Applies consumed Kafka events to the local CDC read model. Every write is
 * scoped by the tenantId carried on the event envelope (consumer threads have
 * no TenantContext). Upserts are keyed by (tenantId, employeeId) for employees
 * and (tenantId, interventionId) for interventions.
 */
@Service
public class ReadModelService {

    private static final Logger log = LoggerFactory.getLogger(ReadModelService.class);

    /** Keep only the most recent N alerts per tenant. */
    private static final int MAX_ALERTS_PER_TENANT = 20;

    private final EmployeeReadModelRepository employeeRepo;
    private final InterventionReadModelRepository interventionRepo;
    private final AlertItemRepository alertRepo;

    public ReadModelService(EmployeeReadModelRepository employeeRepo,
                            InterventionReadModelRepository interventionRepo,
                            AlertItemRepository alertRepo) {
        this.employeeRepo = employeeRepo;
        this.interventionRepo = interventionRepo;
        this.alertRepo = alertRepo;
    }

    // ---------------------------------------------------------------- profile

    @Transactional
    public void onProfileUpdated(String tenantId, JsonNode payload) {
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            return;
        }
        EmployeeReadModel emp = upsertEmployee(tenantId, employeeId);
        emp.setEmployeeName(text(payload, "employeeName"));
        emp.setDepartment(text(payload, "department"));
        if (payload.hasNonNull("riskProfilingOptOut")) {
            emp.setRiskProfilingOptOut(payload.get("riskProfilingOptOut").asBoolean());
        }
        JsonNode snapshot = payload.get("snapshot");
        if (snapshot != null && !snapshot.isNull()) {
            emp.setAttendancePct(dbl(snapshot, "attendancePct"));
            emp.setAvgScore(dbl(snapshot, "avgScore"));
        }
        emp.setUpdatedAt(Instant.now());
        employeeRepo.save(emp);
    }

    // ------------------------------------------------------------------- risk

    @Transactional
    public void onRiskDetected(String tenantId, JsonNode payload) {
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            return;
        }
        EmployeeReadModel emp = upsertEmployee(tenantId, employeeId);
        String employeeName = text(payload, "employeeName");
        if (employeeName != null) {
            emp.setEmployeeName(employeeName);
        }
        String department = text(payload, "department");
        if (department != null) {
            emp.setDepartment(department);
        }
        emp.setRiskLevel(text(payload, "riskLevel"));
        boolean requiresReview = payload.hasNonNull("requiresHumanReview")
                && payload.get("requiresHumanReview").asBoolean();
        emp.setRequiresHumanReview(requiresReview);
        emp.setReviewStatus(requiresReview ? "PENDING" : null);
        emp.setUpdatedAt(Instant.now());
        employeeRepo.save(emp);

        String trigger = text(payload, "trigger");
        String metric = text(payload, "metric");
        String label = employeeName != null ? employeeName : employeeId;
        appendAlert(tenantId, "Learner: " + label,
                (trigger == null ? "Risk detected" : trigger) + " \u2014 " + (metric == null ? "" : metric));
    }

    @Transactional
    public void onRiskReviewCompleted(String tenantId, JsonNode payload) {
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            return;
        }
        EmployeeReadModel emp = employeeRepo.findByTenantIdAndEmployeeId(tenantId, employeeId).orElse(null);
        if (emp == null) {
            log.warn("risk.review.completed for unknown employee {} tenant {}", employeeId, tenantId);
            return;
        }
        String decision = text(payload, "decision");
        emp.setReviewStatus(decision != null ? decision : "REVIEWED");
        String finalRiskLevel = text(payload, "finalRiskLevel");
        if (finalRiskLevel != null) {
            emp.setRiskLevel(finalRiskLevel);
        }
        emp.setUpdatedAt(Instant.now());
        employeeRepo.save(emp);
    }

    @Transactional
    public void onRiskResolved(String tenantId, JsonNode payload) {
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            return;
        }
        EmployeeReadModel emp = employeeRepo.findByTenantIdAndEmployeeId(tenantId, employeeId).orElse(null);
        if (emp == null) {
            return;
        }
        emp.setRiskLevel("RESOLVED");
        emp.setRequiresHumanReview(false);
        emp.setReviewStatus(null);
        emp.setUpdatedAt(Instant.now());
        employeeRepo.save(emp);
    }

    // ----------------------------------------------------------- intervention

    @Transactional
    public void onInterventionAssigned(String tenantId, JsonNode payload) {
        String interventionId = text(payload, "interventionId");
        if (interventionId == null) {
            return;
        }
        InterventionReadModel iv = upsertIntervention(tenantId, interventionId);
        iv.setEmployeeId(text(payload, "employeeId"));
        iv.setType(text(payload, "type"));
        iv.setStatus(text(payload, "status"));
        iv.setUpdatedAt(Instant.now());
        interventionRepo.save(iv);
    }

    @Transactional
    public void onInterventionSessionLogged(String tenantId, JsonNode payload) {
        String interventionId = text(payload, "interventionId");
        if (interventionId == null) {
            return;
        }
        // Read model only tracks status/type; sessions are informational for the POC.
        InterventionReadModel iv = upsertIntervention(tenantId, interventionId);
        iv.setUpdatedAt(Instant.now());
        interventionRepo.save(iv);
    }

    @Transactional
    public void onInterventionCompleted(String tenantId, JsonNode payload) {
        String interventionId = text(payload, "interventionId");
        if (interventionId == null) {
            return;
        }
        InterventionReadModel iv = upsertIntervention(tenantId, interventionId);
        iv.setStatus("COMPLETED");
        String employeeId = text(payload, "employeeId");
        if (employeeId != null) {
            iv.setEmployeeId(employeeId);
        }
        iv.setUpdatedAt(Instant.now());
        interventionRepo.save(iv);

        String improvement = payload.hasNonNull("improvementPct")
                ? String.valueOf(payload.get("improvementPct").asDouble()) : "?";
        String label = employeeId != null ? employeeId : interventionId;
        appendAlert(tenantId, "Learner: " + label,
                "Intervention completed \u2014 improvement " + improvement + "%");
    }

    // ---------------------------------------------------------------- consent

    @Transactional
    public void onConsentEvent(String eventType, String tenantId, JsonNode payload) {
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            return;
        }
        EmployeeReadModel emp = employeeRepo.findByTenantIdAndEmployeeId(tenantId, employeeId).orElse(null);
        if (emp == null) {
            // No profile yet; create a shell row so the opt-out flag is not lost.
            emp = upsertEmployee(tenantId, employeeId);
        }
        String purpose = text(payload, "purpose");
        if ("consent.withdrawn".equals(eventType)) {
            // Authoritative flag if the event carries it; otherwise infer from purpose.
            if (payload.hasNonNull("riskProfilingOptOut")) {
                emp.setRiskProfilingOptOut(payload.get("riskProfilingOptOut").asBoolean());
            } else if ("risk_profiling".equals(purpose)) {
                emp.setRiskProfilingOptOut(true);
            }
        } else { // consent.updated (GRANT)
            String status = text(payload, "status");
            if ("risk_profiling".equals(purpose) && "GRANTED".equalsIgnoreCase(status)) {
                emp.setRiskProfilingOptOut(false);
            }
        }
        emp.setUpdatedAt(Instant.now());
        employeeRepo.save(emp);
    }

    // ----------------------------------------------------------------- helpers

    private EmployeeReadModel upsertEmployee(String tenantId, String employeeId) {
        return employeeRepo.findByTenantIdAndEmployeeId(tenantId, employeeId)
                .orElseGet(() -> {
                    EmployeeReadModel e = new EmployeeReadModel();
                    e.setTenantId(tenantId);
                    e.setEmployeeId(employeeId);
                    return e;
                });
    }

    private InterventionReadModel upsertIntervention(String tenantId, String interventionId) {
        return interventionRepo.findByTenantIdAndInterventionId(tenantId, interventionId)
                .orElseGet(() -> {
                    InterventionReadModel i = new InterventionReadModel();
                    i.setTenantId(tenantId);
                    i.setInterventionId(interventionId);
                    return i;
                });
    }

    private void appendAlert(String tenantId, String entity, String message) {
        AlertItem item = new AlertItem();
        item.setTenantId(tenantId);
        item.setEntity(entity);
        item.setMessage(message);
        item.setOccurredAt(Instant.now());
        alertRepo.save(item);
        trimAlerts(tenantId);
    }

    private void trimAlerts(String tenantId) {
        List<AlertItem> all = alertRepo.findByTenantIdOrderByOccurredAtDesc(tenantId);
        if (all.size() > MAX_ALERTS_PER_TENANT) {
            alertRepo.deleteAll(all.subList(MAX_ALERTS_PER_TENANT, all.size()));
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }

    private static double dbl(JsonNode node, String field) {
        if (node == null) {
            return 0d;
        }
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? 0d : v.asDouble();
    }
}
