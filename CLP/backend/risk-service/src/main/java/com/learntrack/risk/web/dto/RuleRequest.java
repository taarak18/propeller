package com.learntrack.risk.web.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** Body for creating/updating a risk rule. {@code ruleDefinition} is the criteria tree. */
public record RuleRequest(
        String ruleName,
        String description,
        String severity,
        JsonNode ruleDefinition,
        List<String> applicableDepartments,
        List<String> applicableCompetencies) {
}
