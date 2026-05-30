package com.learntrack.profile.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learntrack.common.outbox.OutboxPublisher;
import com.learntrack.profile.model.AssessmentRecord;
import com.learntrack.profile.model.Employee;
import com.learntrack.profile.model.MilestoneProgress;
import com.learntrack.profile.model.TrainingAttendance;
import com.learntrack.profile.repository.AssessmentRecordRepository;
import com.learntrack.profile.repository.EmployeeRepository;
import com.learntrack.profile.repository.MilestoneProgressRepository;
import com.learntrack.profile.repository.TrainingAttendanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Builds the curated learning read model from {@code data.ingested} events,
 * tracks risk-profiling opt-out from consent events, recomputes per-employee
 * metrics, and emits {@code profile.updated}. Every repository call is tenant-scoped.
 */
@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private static final Set<String> PRESENT_STATUSES = Set.of("PRESENT", "ATTENDED", "COMPLETED");

    private final EmployeeRepository employeeRepository;
    private final TrainingAttendanceRepository attendanceRepository;
    private final AssessmentRecordRepository assessmentRepository;
    private final MilestoneProgressRepository milestoneRepository;
    private final OutboxPublisher outboxPublisher;
    private final ObjectMapper objectMapper;

    public ProfileService(EmployeeRepository employeeRepository,
                          TrainingAttendanceRepository attendanceRepository,
                          AssessmentRecordRepository assessmentRepository,
                          MilestoneProgressRepository milestoneRepository,
                          OutboxPublisher outboxPublisher,
                          ObjectMapper objectMapper) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.assessmentRepository = assessmentRepository;
        this.milestoneRepository = milestoneRepository;
        this.outboxPublisher = outboxPublisher;
        this.objectMapper = objectMapper;
    }

    // ---------------------------------------------------------------------
    // Event ingestion
    // ---------------------------------------------------------------------

    @Transactional
    public void applyDataIngested(String tenantId, JsonNode payload) {
        String dataType = text(payload, "dataType");
        JsonNode records = payload.get("records");
        if (dataType == null || records == null || !records.isArray()) {
            log.warn("data.ingested ignored: missing dataType/records for tenant {}", tenantId);
            return;
        }

        Set<String> affected = new LinkedHashSet<>();
        for (JsonNode record : records) {
            String employeeId = text(record, "employeeId");
            if (employeeId == null) {
                continue;
            }
            switch (dataType) {
                case "training-attendance" -> upsertAttendance(tenantId, employeeId, record);
                case "assessments" -> upsertAssessment(tenantId, employeeId, record);
                case "competency-milestones" -> upsertMilestone(tenantId, employeeId, record);
                default -> log.warn("Unknown dataType '{}' for tenant {}", dataType, tenantId);
            }
            affected.add(employeeId);
        }

        for (String employeeId : affected) {
            recomputeAndEmit(tenantId, employeeId);
        }
    }

    @Transactional
    public void applyConsentEvent(String eventType, String tenantId, JsonNode payload) {
        String purpose = text(payload, "purpose");
        if (!"risk_profiling".equals(purpose)) {
            return;
        }
        String employeeId = text(payload, "employeeId");
        if (employeeId == null) {
            log.warn("Consent event {} ignored: no employeeId for tenant {}", eventType, tenantId);
            return;
        }

        boolean withdrawn = eventType != null && eventType.endsWith("withdrawn");
        JsonNode optOutNode = payload.get("riskProfilingOptOut");
        boolean payloadOptOut = optOutNode != null && optOutNode.asBoolean(false);
        boolean optOut = withdrawn || payloadOptOut;

        Employee employee = getOrCreateEmployee(tenantId, employeeId);
        employee.setRiskProfilingOptOut(optOut);
        employeeRepository.save(employee);

        recomputeAndEmit(tenantId, employeeId);
    }

    private void upsertAttendance(String tenantId, String employeeId, JsonNode record) {
        String sessionDate = text(record, "sessionDate");
        String trainingModule = text(record, "trainingModule");
        List<TrainingAttendance> existing = attendanceRepository
                .findByTenantIdAndEmployeeIdAndSessionDateAndTrainingModule(
                        tenantId, employeeId, sessionDate, trainingModule);
        TrainingAttendance row = existing.isEmpty() ? new TrainingAttendance() : existing.get(0);
        row.setTenantId(tenantId);
        row.setEmployeeId(employeeId);
        row.setSessionDate(sessionDate);
        row.setSessionType(text(record, "sessionType"));
        row.setTrainingModule(trainingModule);
        row.setStatus(text(record, "status"));
        row.setReason(text(record, "reason"));
        attendanceRepository.save(row);
    }

    private void upsertAssessment(String tenantId, String employeeId, JsonNode record) {
        String assessmentName = text(record, "assessmentName");
        String assessmentDate = text(record, "assessmentDate");
        List<AssessmentRecord> existing = assessmentRepository
                .findByTenantIdAndEmployeeIdAndAssessmentNameAndAssessmentDate(
                        tenantId, employeeId, assessmentName, assessmentDate);
        AssessmentRecord row = existing.isEmpty() ? new AssessmentRecord() : existing.get(0);
        Double score = dbl(record, "score");
        Double maxScore = dbl(record, "maxScore");
        Double percentage = null;
        if (score != null && maxScore != null && maxScore != 0d) {
            percentage = round1(score / maxScore * 100d);
        }
        row.setTenantId(tenantId);
        row.setEmployeeId(employeeId);
        row.setCompetency(text(record, "competency"));
        row.setTrainingModule(text(record, "trainingModule"));
        row.setAssessmentName(assessmentName);
        row.setScore(score);
        row.setMaxScore(maxScore);
        row.setPercentage(percentage);
        row.setRating(text(record, "rating"));
        row.setAssessmentDate(assessmentDate);
        assessmentRepository.save(row);
    }

    private void upsertMilestone(String tenantId, String employeeId, JsonNode record) {
        String milestoneName = text(record, "milestoneName");
        List<MilestoneProgress> existing = milestoneRepository
                .findByTenantIdAndEmployeeIdAndMilestoneName(tenantId, employeeId, milestoneName);
        MilestoneProgress row = existing.isEmpty() ? new MilestoneProgress() : existing.get(0);
        row.setTenantId(tenantId);
        row.setEmployeeId(employeeId);
        row.setMilestoneName(milestoneName);
        row.setCompetency(text(record, "competency"));
        row.setStatus(text(record, "status"));
        row.setCompletionDate(text(record, "completionDate"));
        row.setProficiencyLevel(text(record, "proficiencyLevel"));
        milestoneRepository.save(row);
    }

    private void recomputeAndEmit(String tenantId, String employeeId) {
        Employee employee = getOrCreateEmployee(tenantId, employeeId);
        Metrics m = computeMetrics(tenantId, employeeId);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("employeeId", employeeId);
        payload.put("employeeName", fullName(employee));
        payload.put("department", employee.getDepartment());
        payload.put("jobTitle", employee.getJobTitle());
        payload.put("riskProfilingOptOut", employee.isRiskProfilingOptOut());

        ObjectNode snapshot = payload.putObject("snapshot");
        snapshot.put("attendancePct", m.attendancePct());
        snapshot.put("avgScore", m.avgScore());
        snapshot.put("scoreTrend", m.scoreTrend());
        snapshot.put("milestoneCompletionPct", m.milestoneCompletionPct());
        snapshot.put("daysSinceProgress", m.daysSinceProgress());

        outboxPublisher.enqueue("profile.updated", tenantId, payload);
    }

    private Employee getOrCreateEmployee(String tenantId, String employeeId) {
        Optional<Employee> existing = employeeRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
        if (existing.isPresent()) {
            return existing.get();
        }
        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setTenantId(tenantId);
        return employeeRepository.save(employee);
    }

    // ---------------------------------------------------------------------
    // Metrics
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Metrics computeMetrics(String tenantId, String employeeId) {
        List<TrainingAttendance> attendance = attendanceRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
        List<AssessmentRecord> assessments = assessmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
        List<MilestoneProgress> milestones = milestoneRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);

        double attendancePct = 0d;
        if (!attendance.isEmpty()) {
            long present = attendance.stream()
                    .filter(a -> a.getStatus() != null
                            && PRESENT_STATUSES.contains(a.getStatus().trim().toUpperCase()))
                    .count();
            attendancePct = round1(present * 100d / attendance.size());
        }

        List<Double> percentages = assessments.stream()
                .sorted(Comparator.comparing(AssessmentRecord::getAssessmentDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(AssessmentRecord::getPercentage)
                .filter(p -> p != null)
                .toList();

        Double avgScore = percentages.isEmpty() ? null
                : round1(percentages.stream().mapToDouble(Double::doubleValue).average().orElse(0d));

        int scoreTrend = 0;
        if (percentages.size() >= 2) {
            int half = percentages.size() / 2;
            double oldAvg = percentages.subList(0, half).stream().mapToDouble(Double::doubleValue).average().orElse(0d);
            double newAvg = percentages.subList(percentages.size() - half, percentages.size())
                    .stream().mapToDouble(Double::doubleValue).average().orElse(0d);
            double diff = newAvg - oldAvg;
            scoreTrend = diff > 0 ? 1 : (diff < 0 ? -1 : 0);
        }

        double milestoneCompletionPct = 0d;
        if (!milestones.isEmpty()) {
            long completed = milestones.stream()
                    .filter(ms -> "COMPLETED".equalsIgnoreCase(ms.getStatus() == null ? null : ms.getStatus().trim()))
                    .count();
            milestoneCompletionPct = round1(completed * 100d / milestones.size());
        }

        long daysSinceProgress = 999;
        LocalDate latest = null;
        for (MilestoneProgress ms : milestones) {
            LocalDate d = parseDate(ms.getCompletionDate());
            if (d != null && (latest == null || d.isAfter(latest))) {
                latest = d;
            }
        }
        if (latest != null) {
            long days = ChronoUnit.DAYS.between(latest, LocalDate.now());
            daysSinceProgress = Math.max(0, days);
        }

        return new Metrics(attendancePct, avgScore, scoreTrend, milestoneCompletionPct, daysSinceProgress);
    }

    // ---------------------------------------------------------------------
    // REST-facing helpers (tenant-scoped)
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Employee> listEmployees(String tenantId, String dept, String q) {
        List<Employee> all = employeeRepository.findByTenantId(tenantId);
        List<Employee> result = new ArrayList<>();
        String deptFilter = dept == null ? null : dept.trim().toLowerCase();
        String qFilter = q == null ? null : q.trim().toLowerCase();
        for (Employee e : all) {
            if (deptFilter != null && !deptFilter.isEmpty()) {
                if (e.getDepartment() == null || !e.getDepartment().toLowerCase().contains(deptFilter)) {
                    continue;
                }
            }
            if (qFilter != null && !qFilter.isEmpty()) {
                String name = fullName(e).toLowerCase();
                if (!name.contains(qFilter)) {
                    continue;
                }
            }
            result.add(e);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Optional<Employee> findEmployee(String tenantId, String employeeId) {
        return employeeRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    @Transactional(readOnly = true)
    public List<TrainingAttendance> attendanceFor(String tenantId, String employeeId) {
        return attendanceRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    @Transactional(readOnly = true)
    public List<AssessmentRecord> assessmentsFor(String tenantId, String employeeId) {
        return assessmentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    @Transactional(readOnly = true)
    public List<MilestoneProgress> milestonesFor(String tenantId, String employeeId) {
        return milestoneRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    @Transactional
    public Employee createEmployee(String tenantId, Employee input) {
        Employee employee = employeeRepository.findByTenantIdAndEmployeeId(tenantId, input.getEmployeeId())
                .orElseGet(Employee::new);
        employee.setEmployeeId(input.getEmployeeId());
        employee.setTenantId(tenantId);
        employee.setFirstName(input.getFirstName());
        employee.setLastName(input.getLastName());
        employee.setDepartment(input.getDepartment());
        employee.setJobTitle(input.getJobTitle());
        employee.setWorkEmail(input.getWorkEmail());
        return employeeRepository.save(employee);
    }

    public String fullName(Employee e) {
        String first = e.getFirstName() == null ? "" : e.getFirstName();
        String last = e.getLastName() == null ? "" : e.getLastName();
        return (first + " " + last).trim();
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static String text(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }

    private static Double dbl(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        if (v.isNumber()) {
            return v.asDouble();
        }
        try {
            return Double.parseDouble(v.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim().substring(0, Math.min(10, value.trim().length())));
        } catch (Exception ex) {
            return null;
        }
    }

    private static double round1(double value) {
        return Math.round(value * 10d) / 10d;
    }
}
