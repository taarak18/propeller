package com.learntrack.intervention.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

/** Pre/post evaluation result for a completed intervention. */
@Entity
@Table(name = "intervention_outcome", indexes = {
        @Index(name = "idx_outcome_tenant_intervention", columnList = "tenantId,interventionId")
})
public class InterventionOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private Long interventionId;

    private String metricType;

    private Double preValue;

    private Double postValue;

    private Double improvementPercentage;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(nullable = false)
    private Instant evaluatedAt = Instant.now();

    public InterventionOutcome() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public Long getInterventionId() { return interventionId; }
    public void setInterventionId(Long interventionId) { this.interventionId = interventionId; }
    public String getMetricType() { return metricType; }
    public void setMetricType(String metricType) { this.metricType = metricType; }
    public Double getPreValue() { return preValue; }
    public void setPreValue(Double preValue) { this.preValue = preValue; }
    public Double getPostValue() { return postValue; }
    public void setPostValue(Double postValue) { this.postValue = postValue; }
    public Double getImprovementPercentage() { return improvementPercentage; }
    public void setImprovementPercentage(Double improvementPercentage) { this.improvementPercentage = improvementPercentage; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(Instant evaluatedAt) { this.evaluatedAt = evaluatedAt; }
}
