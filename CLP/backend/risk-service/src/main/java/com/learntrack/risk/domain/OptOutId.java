package com.learntrack.risk.domain;

import java.io.Serializable;
import java.util.Objects;

/** Composite key for {@link EmployeeOptOut} (tenant + employee). */
public class OptOutId implements Serializable {

    private String tenantId;
    private String employeeId;

    public OptOutId() {
    }

    public OptOutId(String tenantId, String employeeId) {
        this.tenantId = tenantId;
        this.employeeId = employeeId;
    }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OptOutId that)) return false;
        return Objects.equals(tenantId, that.tenantId) && Objects.equals(employeeId, that.employeeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, employeeId);
    }
}
