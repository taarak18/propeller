package com.learntrack.profile.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Curated employee record. {@code employeeId} is the natural key (per CONTRACTS).
 * Every query MUST still be scoped by {@code tenantId} (workspace rule 02).
 */
@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @Column(name = "employee_id")
    private String employeeId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String department;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "work_email")
    private String workEmail;

    @Column(name = "risk_profiling_opt_out", nullable = false)
    private boolean riskProfilingOptOut = false;

    public Employee() {
    }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getWorkEmail() { return workEmail; }
    public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    public boolean isRiskProfilingOptOut() { return riskProfilingOptOut; }
    public void setRiskProfilingOptOut(boolean riskProfilingOptOut) { this.riskProfilingOptOut = riskProfilingOptOut; }
}
