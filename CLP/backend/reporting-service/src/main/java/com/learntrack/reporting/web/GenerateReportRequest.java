package com.learntrack.reporting.web;

/** Body for POST /api/v1/reports/generate. */
public record GenerateReportRequest(String templateType, String period) {
}
