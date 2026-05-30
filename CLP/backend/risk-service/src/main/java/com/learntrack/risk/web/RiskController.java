package com.learntrack.risk.web;

import com.learntrack.common.tenant.TenantContext;
import com.learntrack.risk.service.RiskService;
import com.learntrack.risk.web.dto.ReviewRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/risk")
public class RiskController {

    private static final List<String> REVIEW_ROLES = List.of("TRAINER", "LD_MANAGER", "LD_ADMIN");

    private final RiskService riskService;

    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping("/at-risk")
    public List<Map<String, Object>> atRisk(@RequestParam(required = false) String riskLevel,
                                            @RequestParam(required = false) String dept,
                                            @RequestParam(required = false) String trigger) {
        return riskService.listAtRisk(tenantId(), riskLevel, dept, trigger);
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return riskService.summary(tenantId());
    }

    @GetMapping("/{riskId}")
    public Map<String, Object> detail(@PathVariable Long riskId) {
        return riskService.getDetail(tenantId(), riskId);
    }

    @PostMapping("/{riskId}/review")
    public Map<String, Object> review(@PathVariable Long riskId, @RequestBody ReviewRequest body) {
        TenantContext.Principal principal = TenantContext.get();
        if (principal == null || REVIEW_ROLES.stream().noneMatch(principal::hasRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Reviewer role required");
        }
        String reviewerRole = REVIEW_ROLES.stream().filter(principal::hasRole).findFirst().orElse(null);
        return riskService.review(tenantId(), riskId, principal.userId(), reviewerRole,
                body.decision(), body.newRiskLevel(), body.notes());
    }

    private String tenantId() {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant context");
        }
        return tenantId;
    }
}
