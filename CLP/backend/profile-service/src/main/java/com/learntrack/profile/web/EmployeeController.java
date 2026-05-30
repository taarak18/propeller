package com.learntrack.profile.web;

import com.learntrack.common.tenant.TenantContext;
import com.learntrack.profile.model.AssessmentRecord;
import com.learntrack.profile.model.Employee;
import com.learntrack.profile.model.MilestoneProgress;
import com.learntrack.profile.model.TrainingAttendance;
import com.learntrack.profile.service.Metrics;
import com.learntrack.profile.service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final ProfileService profileService;

    public EmployeeController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<Map<String, Object>> list(
            @RequestParam(value = "dept", required = false) String dept,
            @RequestParam(value = "q", required = false) String q) {
        String tenantId = requireTenant();
        List<Employee> employees = profileService.listEmployees(tenantId, dept, q);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Employee e : employees) {
            Map<String, Object> m = baseEmployee(e);
            Metrics metrics = profileService.computeMetrics(tenantId, e.getEmployeeId());
            m.put("metrics", compactMetrics(metrics));
            out.add(m);
        }
        return out;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detail(@PathVariable("id") String id) {
        String tenantId = requireTenant();
        Employee employee = profileService.findEmployee(tenantId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        Map<String, Object> body = baseEmployee(employee);
        body.put("metrics", fullMetrics(profileService.computeMetrics(tenantId, id)));

        List<Map<String, Object>> attendance = new ArrayList<>();
        for (TrainingAttendance a : profileService.attendanceFor(tenantId, id)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("sessionDate", a.getSessionDate());
            m.put("sessionType", a.getSessionType());
            m.put("trainingModule", a.getTrainingModule());
            m.put("status", a.getStatus());
            m.put("reason", a.getReason());
            attendance.add(m);
        }
        body.put("attendance", attendance);

        List<Map<String, Object>> assessments = new ArrayList<>();
        for (AssessmentRecord a : profileService.assessmentsFor(tenantId, id)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("competency", a.getCompetency());
            m.put("trainingModule", a.getTrainingModule());
            m.put("assessmentName", a.getAssessmentName());
            m.put("score", a.getScore());
            m.put("maxScore", a.getMaxScore());
            m.put("percentage", a.getPercentage());
            m.put("rating", a.getRating());
            m.put("assessmentDate", a.getAssessmentDate());
            assessments.add(m);
        }
        body.put("assessments", assessments);

        List<Map<String, Object>> milestones = new ArrayList<>();
        for (MilestoneProgress ms : profileService.milestonesFor(tenantId, id)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", ms.getId());
            m.put("milestoneName", ms.getMilestoneName());
            m.put("competency", ms.getCompetency());
            m.put("status", ms.getStatus());
            m.put("completionDate", ms.getCompletionDate());
            m.put("proficiencyLevel", ms.getProficiencyLevel());
            milestones.add(m);
        }
        body.put("milestones", milestones);

        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody CreateEmployeeRequest req) {
        String tenantId = requireTenant();
        if (req == null || req.employeeId() == null || req.employeeId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
        }
        Employee input = new Employee();
        input.setEmployeeId(req.employeeId());
        input.setFirstName(req.firstName());
        input.setLastName(req.lastName());
        input.setDepartment(req.department());
        input.setJobTitle(req.jobTitle());
        input.setWorkEmail(req.workEmail());
        Employee saved = profileService.createEmployee(tenantId, input);
        return ResponseEntity.status(HttpStatus.CREATED).body(baseEmployee(saved));
    }

    @GetMapping("/{id}/metrics")
    public Map<String, Object> metrics(@PathVariable("id") String id) {
        String tenantId = requireTenant();
        profileService.findEmployee(tenantId, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        return fullMetrics(profileService.computeMetrics(tenantId, id));
    }

    // ---------------------------------------------------------------------

    private String requireTenant() {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No tenant in context");
        }
        return tenantId;
    }

    private Map<String, Object> baseEmployee(Employee e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("employeeId", e.getEmployeeId());
        m.put("firstName", e.getFirstName());
        m.put("lastName", e.getLastName());
        m.put("department", e.getDepartment());
        m.put("jobTitle", e.getJobTitle());
        m.put("workEmail", e.getWorkEmail());
        m.put("riskProfilingOptOut", e.isRiskProfilingOptOut());
        return m;
    }

    private Map<String, Object> compactMetrics(Metrics m) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("attendancePct", m.attendancePct());
        out.put("avgScore", m.avgScore());
        out.put("scoreTrend", m.scoreTrend());
        out.put("milestoneCompletionPct", m.milestoneCompletionPct());
        return out;
    }

    private Map<String, Object> fullMetrics(Metrics m) {
        Map<String, Object> out = compactMetrics(m);
        out.put("daysSinceProgress", m.daysSinceProgress());
        return out;
    }
}
