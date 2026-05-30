package com.learntrack.reporting.web;

import com.learntrack.common.tenant.TenantContext;
import com.learntrack.reporting.domain.GeneratedReport;
import com.learntrack.reporting.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return reportService.list(tenantId());
    }

    @PostMapping("/generate")
    public Map<String, Object> generate(@RequestBody(required = false) GenerateReportRequest body) {
        String templateType = body == null ? null : body.templateType();
        String period = body == null ? null : body.period();
        return reportService.generate(tenantId(), templateType, period);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        GeneratedReport report = reportService.download(tenantId(), id);
        if (report == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
        }
        String csv = report.getCsvContent() == null ? "" : report.getCsvContent();
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        String filename = (report.getName() == null ? "report" : report.getName().replaceAll("[^A-Za-z0-9._-]", "_"))
                + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    private String tenantId() {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant context");
        }
        return tenantId;
    }
}
