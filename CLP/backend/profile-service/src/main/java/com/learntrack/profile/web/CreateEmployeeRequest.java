package com.learntrack.profile.web;

/** Body for {@code POST /api/v1/employees} (seed/admin). Tenant comes from context, never the body. */
public record CreateEmployeeRequest(
        String employeeId,
        String firstName,
        String lastName,
        String department,
        String jobTitle,
        String workEmail) {
}
