package com.learntrack.reporting.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/** CDC read-model row for one intervention, built from intervention.* events. Upserted on (tenantId, interventionId). */
@Entity
@Table(name = "intervention_read_model",
        uniqueConstraints = @UniqueConstraint(name = "uk_iv_rm_tenant_iv",
                columnNames = {"tenant_id", "intervention_id"}))
public class InterventionReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "intervention_id", nullable = false)
    private String interventionId;

    @Column(name = "employee_id")
    private String employeeId;

    private String type;

    private String status;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public InterventionReadModel() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getInterventionId() { return interventionId; }
    public void setInterventionId(String interventionId) { this.interventionId = interventionId; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
