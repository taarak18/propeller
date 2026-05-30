package com.learntrack.risk.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/** The current risk assessment for an employee (one row per tenant+employee, upserted). */
@Entity
@Table(name = "risk_assessment",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tenantId", "employeeId"}))
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long riskId;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String employeeId;

    private String employeeName;

    private String department;

    private Instant assessmentDate;

    /** CRITICAL | HIGH | MEDIUM | LOW | NONE */
    private String riskLevel;

    private double riskScore;

    /** "trigger" is a reserved SQL keyword, so map to a safe column name. */
    @Column(name = "trigger_label")
    private String trigger;

    private String metric;

    private String threshold;

    @Column(columnDefinition = "text")
    private String riskFactorsJson;

    @Column(columnDefinition = "text")
    private String rulesTriggeredJson;

    @Column(columnDefinition = "text")
    private String recommendedInterventionsJson;

    /** ACTIVE | RESOLVED | NONE */
    private String status;

    private boolean requiresHumanReview;

    /** PENDING | CONFIRMED | OVERRIDDEN | DISMISSED | NONE */
    private String reviewStatus;

    private Instant createdAt;

    private Instant updatedAt;

    public RiskAssessment() {
    }

    public Long getRiskId() { return riskId; }
    public void setRiskId(Long riskId) { this.riskId = riskId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Instant getAssessmentDate() { return assessmentDate; }
    public void setAssessmentDate(Instant assessmentDate) { this.assessmentDate = assessmentDate; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }

    public String getTrigger() { return trigger; }
    public void setTrigger(String trigger) { this.trigger = trigger; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public String getThreshold() { return threshold; }
    public void setThreshold(String threshold) { this.threshold = threshold; }

    public String getRiskFactorsJson() { return riskFactorsJson; }
    public void setRiskFactorsJson(String riskFactorsJson) { this.riskFactorsJson = riskFactorsJson; }

    public String getRulesTriggeredJson() { return rulesTriggeredJson; }
    public void setRulesTriggeredJson(String rulesTriggeredJson) { this.rulesTriggeredJson = rulesTriggeredJson; }

    public String getRecommendedInterventionsJson() { return recommendedInterventionsJson; }
    public void setRecommendedInterventionsJson(String recommendedInterventionsJson) { this.recommendedInterventionsJson = recommendedInterventionsJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isRequiresHumanReview() { return requiresHumanReview; }
    public void setRequiresHumanReview(boolean requiresHumanReview) { this.requiresHumanReview = requiresHumanReview; }

    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
