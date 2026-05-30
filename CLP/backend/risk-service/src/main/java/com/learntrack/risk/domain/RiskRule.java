package com.learntrack.risk.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** A tenant-defined risk rule. {@code ruleDefinitionJson} holds the criteria tree (see RuleEngine). */
@Entity
@Table(name = "risk_rule")
public class RiskRule {

    @Id
    private String ruleId;

    @Column(nullable = false)
    private String tenantId;

    private String ruleName;

    @Column(columnDefinition = "text")
    private String description;

    /** CRITICAL | HIGH | MEDIUM | LOW */
    private String severity;

    @Column(columnDefinition = "text")
    private String ruleDefinitionJson;

    private boolean active;

    /** CSV of department names this rule applies to (empty/null = all). */
    private String applicableDepartments;

    /** CSV of competencies this rule applies to (empty/null = all). */
    private String applicableCompetencies;

    private int version;

    private String createdBy;

    private Instant createdAt;

    private Instant updatedAt;

    public RiskRule() {
    }

    public String getRuleId() { return ruleId; }
    public void setRuleId(String ruleId) { this.ruleId = ruleId; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getRuleDefinitionJson() { return ruleDefinitionJson; }
    public void setRuleDefinitionJson(String ruleDefinitionJson) { this.ruleDefinitionJson = ruleDefinitionJson; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getApplicableDepartments() { return applicableDepartments; }
    public void setApplicableDepartments(String applicableDepartments) { this.applicableDepartments = applicableDepartments; }

    public String getApplicableCompetencies() { return applicableCompetencies; }
    public void setApplicableCompetencies(String applicableCompetencies) { this.applicableCompetencies = applicableCompetencies; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
