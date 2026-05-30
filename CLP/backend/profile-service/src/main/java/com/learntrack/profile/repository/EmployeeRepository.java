package com.learntrack.profile.repository;

import com.learntrack.profile.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** All finders are tenant-scoped (workspace rule 02). */
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    List<Employee> findByTenantId(String tenantId);

    Optional<Employee> findByTenantIdAndEmployeeId(String tenantId, String employeeId);
}
