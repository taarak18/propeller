package com.learntrack.risk.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.Instant;

/** Local cache of employees that opted out of risk profiling, maintained from consent events. */
@Entity
@Table(name = "employee_opt_out")
@IdClass(OptOutId.class)
public class EmployeeOptOut {

    @Id
    private String tenantId;

    @Id
    private String employeeId;

    private boolean optedOut;

    private Instant updatedAt;

    public EmployeeOptOut() {
    }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public boolean isOptedOut() { return optedOut; }
    public void setOptedOut(boolean optedOut) { this.optedOut = optedOut; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
