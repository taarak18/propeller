package com.learntrack.risk.web.dto;

/** Body for POST /api/v1/risk/{riskId}/review. */
public record ReviewRequest(String decision, String newRiskLevel, String notes) {
}
