package com.learntrack.intervention.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learntrack.common.outbox.OutboxPublisher;
import com.learntrack.intervention.domain.Intervention;
import com.learntrack.intervention.domain.InterventionOutcome;
import com.learntrack.intervention.domain.InterventionSession;
import com.learntrack.intervention.domain.InterventionStatus;
import com.learntrack.intervention.repository.InterventionOutcomeRepository;
import com.learntrack.intervention.repository.InterventionRepository;
import com.learntrack.intervention.repository.InterventionSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Domain logic + state machine for interventions. Every query is scoped by tenantId. */
@Service
public class InterventionService {

    private static final Logger log = LoggerFactory.getLogger(InterventionService.class);

    private final InterventionRepository interventionRepository;
    private final InterventionSessionRepository sessionRepository;
    private final InterventionOutcomeRepository outcomeRepository;
    private final OutboxPublisher outboxPublisher;
    private final ObjectMapper objectMapper;

    public InterventionService(InterventionRepository interventionRepository,
                               InterventionSessionRepository sessionRepository,
                               InterventionOutcomeRepository outcomeRepository,
                               OutboxPublisher outboxPublisher,
                               ObjectMapper objectMapper) {
        this.interventionRepository = interventionRepository;
        this.sessionRepository = sessionRepository;
        this.outcomeRepository = outcomeRepository;
        this.outboxPublisher = outboxPublisher;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Intervention> list(String tenantId, InterventionStatus status) {
        if (status != null) {
            return interventionRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status);
        }
        return interventionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Intervention get(String tenantId, Long id) {
        return interventionRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention not found"));
    }

    @Transactional(readOnly = true)
    public List<InterventionSession> sessions(String tenantId, Long interventionId) {
        return sessionRepository.findByTenantIdAndInterventionIdOrderBySessionDateAsc(tenantId, interventionId);
    }

    /** Manual creation via REST → PENDING_APPROVAL; emits intervention.assigned. */
    @Transactional
    public Intervention create(String tenantId, String employeeId, String employeeName, String riskId,
                               String interventionType, String description, LocalDate startDate,
                               LocalDate endDate, int totalSessions, String assignedTrainer) {
        Intervention iv = new Intervention();
        iv.setTenantId(tenantId);
        iv.setEmployeeId(employeeId);
        iv.setEmployeeName(employeeName);
        iv.setRiskId(riskId);
        iv.setInterventionType(interventionType);
        iv.setDescription(description);
        iv.setStartDate(startDate);
        iv.setEndDate(endDate);
        iv.setTotalSessions(totalSessions);
        iv.setAssignedTrainer(assignedTrainer);
        iv.setStatus(InterventionStatus.PENDING_APPROVAL);
        iv.setCreatedAt(Instant.now());
        iv.setUpdatedAt(Instant.now());
        iv = interventionRepository.save(iv);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("interventionId", iv.getId());
        payload.put("employeeId", iv.getEmployeeId());
        payload.put("type", iv.getInterventionType());
        payload.put("status", iv.getStatus().name());
        outboxPublisher.enqueue("intervention.assigned", tenantId, payload);
        return iv;
    }

    /** Auto-creation from a risk.detected event → RECOMMENDED. De-duplicated per open riskId. */
    @Transactional
    public void autoCreateFromRisk(String tenantId, String employeeId, String employeeName,
                                   String riskId, String recommendedType) {
        if (riskId != null && interventionRepository
                .existsByTenantIdAndRiskIdAndStatus(tenantId, riskId, InterventionStatus.RECOMMENDED)) {
            log.info("Skipping duplicate RECOMMENDED intervention for tenant={} riskId={}", tenantId, riskId);
            return;
        }
        Intervention iv = new Intervention();
        iv.setTenantId(tenantId);
        iv.setEmployeeId(employeeId);
        iv.setEmployeeName(employeeName);
        iv.setRiskId(riskId);
        iv.setInterventionType(recommendedType);
        iv.setDescription("Auto-recommended from risk detection");
        iv.setStatus(InterventionStatus.RECOMMENDED);
        iv.setCreatedAt(Instant.now());
        iv.setUpdatedAt(Instant.now());
        iv = interventionRepository.save(iv);
        log.info("Auto-created RECOMMENDED intervention for tenant={} employeeId={} riskId={}",
                tenantId, employeeId, riskId);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("interventionId", iv.getId());
        payload.put("employeeId", iv.getEmployeeId());
        payload.put("type", iv.getInterventionType());
        payload.put("status", InterventionStatus.RECOMMENDED.name());
        outboxPublisher.enqueue("intervention.assigned", tenantId, payload);
    }

    @Transactional
    public Intervention approve(String tenantId, Long id) {
        Intervention iv = get(tenantId, id);
        if (!isApprovable(iv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only RECOMMENDED/PENDING_APPROVAL/ESCALATED interventions can be approved");
        }
        iv.setStatus(InterventionStatus.ACTIVE);
        iv = interventionRepository.save(iv);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("interventionId", iv.getId());
        payload.put("employeeId", iv.getEmployeeId());
        payload.put("type", iv.getInterventionType());
        payload.put("status", InterventionStatus.ACTIVE.name());
        outboxPublisher.enqueue("intervention.assigned", tenantId, payload);
        return iv;
    }

    @Transactional
    public Intervention reject(String tenantId, Long id) {
        Intervention iv = get(tenantId, id);
        if (!isApprovable(iv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only RECOMMENDED/PENDING_APPROVAL/ESCALATED interventions can be rejected");
        }
        iv.setStatus(InterventionStatus.REJECTED);
        return interventionRepository.save(iv);
    }

    private static boolean isApprovable(InterventionStatus status) {
        return status == InterventionStatus.RECOMMENDED
                || status == InterventionStatus.PENDING_APPROVAL
                || status == InterventionStatus.ESCALATED;
    }

    @Transactional
    public InterventionSession logSession(String tenantId, Long id, LocalDate sessionDate,
                                          boolean attended, String notes) {
        Intervention iv = get(tenantId, id);

        InterventionSession session = new InterventionSession();
        session.setTenantId(tenantId);
        session.setInterventionId(iv.getId());
        session.setSessionDate(sessionDate);
        session.setAttended(attended);
        session.setNotes(notes);
        session = sessionRepository.save(session);

        if (attended) {
            iv.setSessionsAttended(iv.getSessionsAttended() + 1);
            interventionRepository.save(iv);
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("interventionId", iv.getId());
        payload.put("sessionsAttended", iv.getSessionsAttended());
        payload.put("totalSessions", iv.getTotalSessions());
        outboxPublisher.enqueue("intervention.session.logged", tenantId, payload);
        return session;
    }

    @Transactional
    public Intervention complete(String tenantId, Long id, Double preValue, Double postValue) {
        Intervention iv = get(tenantId, id);
        iv.setStatus(InterventionStatus.COMPLETED);
        interventionRepository.save(iv);

        double improvementPct = 0.0;
        if (preValue != null && postValue != null && preValue != 0.0) {
            improvementPct = (postValue - preValue) / preValue * 100.0;
        }

        InterventionOutcome outcome = new InterventionOutcome();
        outcome.setTenantId(tenantId);
        outcome.setInterventionId(iv.getId());
        outcome.setMetricType("effectiveness");
        outcome.setPreValue(preValue);
        outcome.setPostValue(postValue);
        outcome.setImprovementPercentage(improvementPct);
        outcome.setEvaluatedAt(Instant.now());
        outcomeRepository.save(outcome);

        iv.setStatus(InterventionStatus.EVALUATED);
        interventionRepository.save(iv);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("interventionId", iv.getId());
        payload.put("employeeId", iv.getEmployeeId());
        payload.put("improvementPct", improvementPct);
        outboxPublisher.enqueue("intervention.completed", tenantId, payload);
        return iv;
    }

    @Transactional(readOnly = true)
    public JsonNode summary(String tenantId) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("active", interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.ACTIVE));
        node.put("pendingApproval",
                interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.RECOMMENDED)
                        + interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.PENDING_APPROVAL)
                        + interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.ESCALATED));
        node.put("completed",
                interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.EVALUATED)
                        + interventionRepository.countByTenantIdAndStatus(tenantId, InterventionStatus.COMPLETED));
        return node;
    }
}
