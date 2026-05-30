package com.learntrack.reporting.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * CDC read-model row for one employee, assembled purely from consumed Kafka
 * events (profile.updated, risk.*, consent.*). Upserted on (tenantId, employeeId).
 * This service never reads any other service's schema.
 */
@Entity
@Table(name = "employee_read_model",
        uniqueConstraints = @UniqueConstraint(name = "uk_emp_rm_tenant_emp",
                columnNames = {"tenant_id", "employee_id"}))
public class EmployeeReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "employee_id", nullable = false)
    private String employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    private String department;

    @Column(name = "attendance_pct")
    private double attendancePct;

    @Column(name = "avg_score")
    private double avgScore;

    @Column(name = "risk_level")
    private String riskLevel;

    @Column(name = "requires_human_review")
    private boolean requiresHumanReview;

    @Column(name = "review_status")
    private String reviewStatus;

    @Column(name = "risk_profiling_opt_out")
    private boolean riskProfilingOptOut;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public EmployeeReadModel() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public double getAttendancePct() { return attendancePct; }
    public void setAttendancePct(double attendancePct) { this.attendancePct = attendancePct; }
    public double getAvgScore() { return avgScore; }
    public void setAvgScore(double avgScore) { this.avgScore = avgScore; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public boolean isRequiresHumanReview() { return requiresHumanReview; }
    public void setRequiresHumanReview(boolean requiresHumanReview) { this.requiresHumanReview = requiresHumanReview; }
    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }
    public boolean isRiskProfilingOptOut() { return riskProfilingOptOut; }
    public void setRiskProfilingOptOut(boolean riskProfilingOptOut) { this.riskProfilingOptOut = riskProfilingOptOut; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
