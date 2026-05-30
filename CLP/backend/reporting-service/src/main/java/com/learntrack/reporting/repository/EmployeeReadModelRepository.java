package com.learntrack.reporting.repository;

import com.learntrack.reporting.domain.EmployeeReadModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeReadModelRepository extends JpaRepository<EmployeeReadModel, Long> {

    Optional<EmployeeReadModel> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    List<EmployeeReadModel> findByTenantId(String tenantId);
}
