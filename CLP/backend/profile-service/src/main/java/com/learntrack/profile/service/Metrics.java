package com.learntrack.profile.service;

/**
 * Computed learning metrics for an employee (see CONTRACTS §profile.updated snapshot).
 * {@code avgScore} is nullable: it is {@code null} when the employee has no assessment
 * rows yet, so downstream rules (e.g. "competency_average_score less_than 60") do not
 * falsely match a 0.0 during the pre-ingestion window.
 */
public record Metrics(
        double attendancePct,
        Double avgScore,
        int scoreTrend,
        double milestoneCompletionPct,
        long daysSinceProgress) {
}
