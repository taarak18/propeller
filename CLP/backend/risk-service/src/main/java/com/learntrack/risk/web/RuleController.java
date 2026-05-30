package com.learntrack.risk.web;

import com.learntrack.common.tenant.TenantContext;
import com.learntrack.risk.service.RuleService;
import com.learntrack.risk.web.dto.RuleRequest;
import com.learntrack.risk.web.dto.RuleTestRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rules")
public class RuleController {

    private final RuleService ruleService;

    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return ruleService.list(tenantId());
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody RuleRequest body) {
        return ruleService.create(tenantId(), TenantContext.userId(), body);
    }

    @PutMapping("/{ruleId}")
    public Map<String, Object> update(@PathVariable String ruleId, @RequestBody RuleRequest body) {
        return ruleService.update(tenantId(), ruleId, body);
    }

    @PostMapping("/{ruleId}/test")
    public Map<String, Object> test(@PathVariable String ruleId, @RequestBody RuleTestRequest body) {
        return ruleService.test(tenantId(), ruleId, body);
    }

    @PutMapping("/{ruleId}/activate")
    public Map<String, Object> activate(@PathVariable String ruleId) {
        return ruleService.activate(tenantId(), ruleId);
    }

    private String tenantId() {
        String tenantId = TenantContext.tenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing tenant context");
        }
        return tenantId;
    }
}
