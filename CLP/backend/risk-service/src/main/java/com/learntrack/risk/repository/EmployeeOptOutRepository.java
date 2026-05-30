package com.learntrack.risk.repository;

import com.learntrack.risk.domain.EmployeeOptOut;
import com.learntrack.risk.domain.OptOutId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeOptOutRepository extends JpaRepository<EmployeeOptOut, OptOutId> {

    Optional<EmployeeOptOut> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    boolean existsByTenantIdAndEmployeeIdAndOptedOutTrue(String tenantId, String employeeId);
}
