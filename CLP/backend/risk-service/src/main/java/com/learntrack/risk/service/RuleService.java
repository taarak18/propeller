package com.learntrack.risk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.risk.domain.RiskRule;
import com.learntrack.risk.engine.RuleEngine;
import com.learntrack.risk.repository.RiskRuleRepository;
import com.learntrack.risk.web.dto.RuleRequest;
import com.learntrack.risk.web.dto.RuleTestRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Rule lifecycle (draft → activate), editing and dry-run testing. */
@Service
public class RuleService {

    private final RiskRuleRepository ruleRepository;
    private final RuleEngine ruleEngine;
    private final ObjectMapper objectMapper;

    public RuleService(RiskRuleRepository ruleRepository, RuleEngine ruleEngine, ObjectMapper objectMapper) {
        this.ruleRepository = ruleRepository;
        this.ruleEngine = ruleEngine;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String tenantId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (RiskRule r : ruleRepository.findByTenantId(tenantId)) {
            out.add(toMap(r));
        }
        return out;
    }

    @Transactional
    public Map<String, Object> create(String tenantId, String userId, RuleRequest req) {
        Instant now = Instant.now();
        RiskRule rule = new RiskRule();
        rule.setRuleId("rule_" + UUID.randomUUID().toString().substring(0, 8));
        rule.setTenantId(tenantId);
        rule.setRuleName(req.ruleName());
        rule.setDescription(req.description());
        rule.setSeverity(req.severity() == null ? "MEDIUM" : req.severity().toUpperCase());
        rule.setRuleDefinitionJson(definitionToString(req.ruleDefinition()));
        rule.setActive(false);
        rule.setApplicableDepartments(csv(req.applicableDepartments()));
        rule.setApplicableCompetencies(csv(req.applicableCompetencies()));
        rule.setVersion(1);
        rule.setCreatedBy(userId);
        rule.setCreatedAt(now);
        rule.setUpdatedAt(now);
        return toMap(ruleRepository.save(rule));
    }

    @Transactional
    public Map<String, Object> update(String tenantId, String ruleId, RuleRequest req) {
        RiskRule rule = require(tenantId, ruleId);
        if (req.ruleName() != null) {
            rule.setRuleName(req.ruleName());
        }
        if (req.description() != null) {
            rule.setDescription(req.description());
        }
        if (req.severity() != null) {
            rule.setSeverity(req.severity().toUpperCase());
        }
        if (req.ruleDefinition() != null && !req.ruleDefinition().isNull()) {
            rule.setRuleDefinitionJson(definitionToString(req.ruleDefinition()));
        }
        if (req.applicableDepartments() != null) {
            rule.setApplicableDepartments(csv(req.applicableDepartments()));
        }
        if (req.applicableCompetencies() != null) {
            rule.setApplicableCompetencies(csv(req.applicableCompetencies()));
        }
        rule.setUpdatedAt(Instant.now());
        return toMap(ruleRepository.save(rule));
    }

    @Transactional
    public Map<String, Object> activate(String tenantId, String ruleId) {
        RiskRule rule = require(tenantId, ruleId);
        rule.setActive(true);
        rule.setVersion(rule.getVersion() + 1);
        rule.setUpdatedAt(Instant.now());
        return toMap(ruleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> test(String tenantId, String ruleId, RuleTestRequest req) {
        RiskRule rule = require(tenantId, ruleId);
        int total = 0;
        int matched = 0;
        if (req != null && req.profiles() != null) {
            for (JsonNode profile : req.profiles()) {
                total++;
                JsonNode snapshot = profile.has("snapshot") ? profile.path("snapshot") : profile;
                if (ruleEngine.matches(rule, snapshot)) {
                    matched++;
                }
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("matched", matched);
        out.put("total", total);
        return out;
    }

    private RiskRule require(String tenantId, String ruleId) {
        return ruleRepository.findByRuleIdAndTenantId(ruleId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));
    }

    private Map<String, Object> toMap(RiskRule r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ruleId", r.getRuleId());
        m.put("ruleName", r.getRuleName());
        m.put("description", r.getDescription());
        m.put("severity", r.getSeverity());
        m.put("ruleDefinition", parseDefinition(r.getRuleDefinitionJson()));
        m.put("isActive", r.isActive());
        m.put("applicableDepartments", fromCsv(r.getApplicableDepartments()));
        m.put("applicableCompetencies", fromCsv(r.getApplicableCompetencies()));
        m.put("version", r.getVersion());
        m.put("createdBy", r.getCreatedBy());
        m.put("createdAt", r.getCreatedAt());
        m.put("updatedAt", r.getUpdatedAt());
        return m;
    }

    private String definitionToString(JsonNode definition) {
        if (definition == null || definition.isNull()) {
            return "{\"operator\":\"AND\",\"criteria\":[]}";
        }
        return definition.toString();
    }

    private JsonNode parseDefinition(String json) {
        if (json == null || json.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String csv(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return String.join(",", values);
    }

    private List<String> fromCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return List.of(csv.split(","));
    }
}
