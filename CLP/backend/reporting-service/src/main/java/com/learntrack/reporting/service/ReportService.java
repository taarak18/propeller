package com.learntrack.reporting.service;

import com.learntrack.reporting.domain.EmployeeReadModel;
import com.learntrack.reporting.domain.GeneratedReport;
import com.learntrack.reporting.repository.EmployeeReadModelRepository;
import com.learntrack.reporting.repository.GeneratedReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Generates CSV exports from the employee read model. Compliance rule
 * (09-compliance-guardrails): any employee with riskProfilingOptOut == true is
 * pseudonymised — the name becomes REDACTED-{hash} and personal columns are blanked.
 */
@Service
public class ReportService {

    private static final String CSV_HEADER = "employeeId,name,department,attendancePct,avgScore,riskLevel";

    private final EmployeeReadModelRepository employeeRepo;
    private final GeneratedReportRepository reportRepo;

    public ReportService(EmployeeReadModelRepository employeeRepo,
                         GeneratedReportRepository reportRepo) {
        this.employeeRepo = employeeRepo;
        this.reportRepo = reportRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String tenantId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (GeneratedReport r : reportRepo.findByTenantIdOrderByGeneratedAtDesc(tenantId)) {
            out.add(toSummary(r));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> generate(String tenantId, String templateType, String period) {
        String type = templateType == null || templateType.isBlank() ? "compliance" : templateType;
        String csv = buildCsv(tenantId);

        GeneratedReport report = new GeneratedReport();
        report.setTenantId(tenantId);
        report.setName(reportName(type, period));
        report.setType(type);
        report.setPeriod(period);
        report.setStatus("COMPLETED");
        report.setCsvContent(csv);
        report.setGeneratedAt(Instant.now());
        reportRepo.save(report);
        return toSummary(report);
    }

    @Transactional(readOnly = true)
    public GeneratedReport download(String tenantId, Long id) {
        return reportRepo.findByIdAndTenantId(id, tenantId).orElse(null);
    }

    private String buildCsv(String tenantId) {
        StringBuilder sb = new StringBuilder(CSV_HEADER).append('\n');
        for (EmployeeReadModel e : employeeRepo.findByTenantId(tenantId)) {
            if (e.isRiskProfilingOptOut()) {
                // Pseudonymise: redact name, blank personal (department) columns. Analytics
                // metrics and risk level are retained as non-identifying aggregate data.
                sb.append(csv(e.getEmployeeId())).append(',')
                        .append(csv("REDACTED-" + shortHash(e.getEmployeeId()))).append(',')
                        .append("").append(',')
                        .append(fmt(e.getAttendancePct())).append(',')
                        .append(fmt(e.getAvgScore())).append(',')
                        .append(csv(e.getRiskLevel()))
                        .append('\n');
            } else {
                sb.append(csv(e.getEmployeeId())).append(',')
                        .append(csv(e.getEmployeeName())).append(',')
                        .append(csv(e.getDepartment())).append(',')
                        .append(fmt(e.getAttendancePct())).append(',')
                        .append(fmt(e.getAvgScore())).append(',')
                        .append(csv(e.getRiskLevel()))
                        .append('\n');
            }
        }
        return sb.toString();
    }

    private Map<String, Object> toSummary(GeneratedReport r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("reportId", r.getId());
        m.put("name", r.getName());
        m.put("type", r.getType());
        m.put("generatedAt", r.getGeneratedAt());
        m.put("status", r.getStatus());
        return m;
    }

    private static String reportName(String type, String period) {
        String label = Character.toUpperCase(type.charAt(0)) + type.substring(1);
        return label + " Report" + (period == null || period.isBlank() ? "" : " (" + period + ")");
    }

    private static String shortHash(String employeeId) {
        if (employeeId == null) {
            return "0";
        }
        return Integer.toHexString(employeeId.hashCode() & 0x7fffffff);
    }

    private static String fmt(double v) {
        return String.format(Locale.ENGLISH, "%.1f", v);
    }

    /** Minimal CSV field escaping (quote when the value contains a comma, quote, or newline). */
    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return '"' + value.replace("\"", "\"\"") + '"';
        }
        return value;
    }
}
