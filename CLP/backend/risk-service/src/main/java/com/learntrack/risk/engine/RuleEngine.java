package com.learntrack.risk.engine;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learntrack.risk.domain.RiskRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Evaluates rule-definition JSON against a profile snapshot.
 *
 * <p>Rule definition shape:
 * <pre>{ "operator":"AND|OR", "criteria":[{ "metric":..., "operator":"less_than|greater_than|equals", "value": n }] }</pre>
 */
@Component
public class RuleEngine {

    private static final Logger log = LoggerFactory.getLogger(RuleEngine.class);

    /** Maps the public metric name to the snapshot JSON field. */
    private static final Map<String, String> METRIC_FIELD = Map.of(
            "training_attendance_percentage", "attendancePct",
            "competency_average_score", "avgScore",
            "score_trend", "scoreTrend",
            "milestone_completion_percentage", "milestoneCompletionPct",
            "days_since_progress", "daysSinceProgress"
    );

    /** Human-readable trigger label per metric. */
    private static final Map<String, String> METRIC_LABEL = Map.of(
            "training_attendance_percentage", "Low Attendance",
            "competency_average_score", "Low Competency Score",
            "score_trend", "Declining Score Trend",
            "milestone_completion_percentage", "Incomplete Milestones",
            "days_since_progress", "Stalled Progress"
    );

    private final ObjectMapper objectMapper;

    public RuleEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Evaluate all supplied (active) rules against the snapshot and compute a weighted result. */
    public EvaluationResult evaluate(List<RiskRule> rules, JsonNode snapshot) {
        EvaluationResult result = new EvaluationResult();
        double score = 0;
        for (RiskRule rule : rules) {
            RuleMatch match = evaluateRule(rule, snapshot);
            if (!match.matched()) {
                continue;
            }
            result.getMatchedRules().add(rule);
            score += weight(rule.getSeverity());
            for (JsonNode criterion : match.matchedCriteria()) {
                result.getRiskFactors().add(factor(rule, criterion, snapshot));
            }
            if (result.getTrigger() == null && !match.matchedCriteria().isEmpty()) {
                applyDisplay(result, match.matchedCriteria().get(0), snapshot);
            }
        }
        score = Math.min(100.0, score);
        result.setScore(score);
        int highestMatchedSeverity = 0;
        for (RiskRule matchedRule : result.getMatchedRules()) {
            highestMatchedSeverity = Math.max(highestMatchedSeverity, severityRank(matchedRule.getSeverity()));
        }
        result.setRiskLevel(classify(score, result.anyMatched(), highestMatchedSeverity));
        return result;
    }

    /** True if the single rule matches the snapshot (used by the rule test endpoint). */
    public boolean matches(RiskRule rule, JsonNode snapshot) {
        return evaluateRule(rule, snapshot).matched();
    }

    private RuleMatch evaluateRule(RiskRule rule, JsonNode snapshot) {
        if (snapshot == null || rule.getRuleDefinitionJson() == null) {
            return new RuleMatch(false, List.of());
        }
        try {
            JsonNode def = objectMapper.readTree(rule.getRuleDefinitionJson());
            String operator = def.path("operator").asText("AND");
            JsonNode criteria = def.path("criteria");
            List<JsonNode> matched = new ArrayList<>();
            int total = 0;
            if (criteria.isArray()) {
                for (JsonNode criterion : criteria) {
                    total++;
                    if (criterionMatches(criterion, snapshot)) {
                        matched.add(criterion);
                    }
                }
            }
            boolean ruleMatched;
            if ("OR".equalsIgnoreCase(operator)) {
                ruleMatched = !matched.isEmpty();
            } else {
                ruleMatched = total > 0 && matched.size() == total;
            }
            return new RuleMatch(ruleMatched, matched);
        } catch (Exception e) {
            log.warn("Failed to evaluate rule {}: {}", rule.getRuleId(), e.getMessage());
            return new RuleMatch(false, List.of());
        }
    }

    private boolean criterionMatches(JsonNode criterion, JsonNode snapshot) {
        Double actual = metricValue(snapshot, criterion.path("metric").asText());
        if (actual == null) {
            return false;
        }
        String op = criterion.path("operator").asText();
        double target = criterion.path("value").asDouble();
        return switch (op) {
            case "less_than" -> actual < target;
            case "greater_than" -> actual > target;
            case "equals" -> Math.abs(actual - target) < 1e-9;
            default -> false;
        };
    }

    private Double metricValue(JsonNode snapshot, String metric) {
        String field = METRIC_FIELD.get(metric);
        if (field == null) {
            return null;
        }
        JsonNode node = snapshot.path(field);
        if (node.isMissingNode() || node.isNull() || !node.isNumber()) {
            return null;
        }
        return node.asDouble();
    }

    private void applyDisplay(EvaluationResult result, JsonNode criterion, JsonNode snapshot) {
        String metric = criterion.path("metric").asText();
        Double actual = metricValue(snapshot, metric);
        result.setTrigger(METRIC_LABEL.getOrDefault(metric, metric));
        result.setMetric(metricDisplay(metric, actual));
        result.setThreshold(thresholdDisplay(metric, criterion.path("value").asDouble()));
    }

    private String factor(RiskRule rule, JsonNode criterion, JsonNode snapshot) {
        String metric = criterion.path("metric").asText();
        Double actual = metricValue(snapshot, metric);
        return rule.getRuleName() + " — " + metricDisplay(metric, actual)
                + " (" + thresholdDisplay(metric, criterion.path("value").asDouble()) + ")";
    }

    private String metricDisplay(String metric, Double actual) {
        if (actual == null) {
            return METRIC_LABEL.getOrDefault(metric, metric);
        }
        return switch (metric) {
            case "training_attendance_percentage" -> "Compliance: " + pct(actual);
            case "competency_average_score" -> "Avg Score: " + num(actual);
            case "score_trend" -> "Trend: " + num(actual);
            case "milestone_completion_percentage" -> "Milestones: " + pct(actual);
            case "days_since_progress" -> "Idle: " + (long) (double) actual + " days";
            default -> num(actual);
        };
    }

    private String thresholdDisplay(String metric, double target) {
        return switch (metric) {
            case "training_attendance_percentage", "milestone_completion_percentage" ->
                    "Threshold: " + pct(target);
            case "days_since_progress" -> "Threshold: " + (long) target + " days";
            default -> "Threshold: " + num(target);
        };
    }

    private String pct(double v) {
        return num(v) + "%";
    }

    private String num(double v) {
        if (v == Math.floor(v) && !Double.isInfinite(v)) {
            return Long.toString((long) v);
        }
        return String.format("%.1f", v);
    }

    private int weight(String severity) {
        if (severity == null) {
            return 0;
        }
        return switch (severity.toUpperCase()) {
            case "CRITICAL" -> 40;
            case "HIGH" -> 25;
            case "MEDIUM" -> 15;
            case "LOW" -> 8;
            default -> 0;
        };
    }

    /**
     * Final level is the most severe of the score bucket and the highest matched rule severity.
     * A matched CRITICAL rule therefore guarantees a CRITICAL assessment regardless of weighted score.
     */
    private String classify(double score, boolean anyMatched, int highestMatchedSeverity) {
        if (!anyMatched) {
            return "NONE";
        }
        int scoreBucket;
        if (score >= 85) {
            scoreBucket = 4;
        } else if (score >= 65) {
            scoreBucket = 3;
        } else if (score >= 40) {
            scoreBucket = 2;
        } else {
            scoreBucket = 1;
        }
        return rankToLevel(Math.max(scoreBucket, highestMatchedSeverity));
    }

    private int severityRank(String severity) {
        if (severity == null) {
            return 0;
        }
        return switch (severity.toUpperCase()) {
            case "CRITICAL" -> 4;
            case "HIGH" -> 3;
            case "MEDIUM" -> 2;
            case "LOW" -> 1;
            default -> 0;
        };
    }

    private String rankToLevel(int rank) {
        return switch (rank) {
            case 4 -> "CRITICAL";
            case 3 -> "HIGH";
            case 2 -> "MEDIUM";
            default -> "LOW";
        };
    }

    private record RuleMatch(boolean matched, List<JsonNode> matchedCriteria) {
    }
}
