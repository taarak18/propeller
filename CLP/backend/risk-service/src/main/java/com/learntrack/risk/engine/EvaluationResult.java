package com.learntrack.risk.engine;

import com.learntrack.risk.domain.RiskRule;

import java.util.ArrayList;
import java.util.List;

/** Outcome of evaluating a tenant's active rules against one employee snapshot. */
public class EvaluationResult {

    private double score;
    private String riskLevel = "NONE";
    private String trigger;
    private String metric;
    private String threshold;
    private final List<RiskRule> matchedRules = new ArrayList<>();
    private final List<String> riskFactors = new ArrayList<>();

    public boolean anyMatched() {
        return !matchedRules.isEmpty();
    }

    public List<String> ruleIds() {
        List<String> ids = new ArrayList<>();
        for (RiskRule r : matchedRules) {
            ids.add(r.getRuleId());
        }
        return ids;
    }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getTrigger() { return trigger; }
    public void setTrigger(String trigger) { this.trigger = trigger; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public String getThreshold() { return threshold; }
    public void setThreshold(String threshold) { this.threshold = threshold; }

    public List<RiskRule> getMatchedRules() { return matchedRules; }

    public List<String> getRiskFactors() { return riskFactors; }
}
