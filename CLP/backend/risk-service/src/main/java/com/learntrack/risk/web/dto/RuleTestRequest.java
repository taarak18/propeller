package com.learntrack.risk.web.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** Body for POST /api/v1/rules/{id}/test. Each profile may be a snapshot or wrap one under "snapshot". */
public record RuleTestRequest(List<JsonNode> profiles) {
}
