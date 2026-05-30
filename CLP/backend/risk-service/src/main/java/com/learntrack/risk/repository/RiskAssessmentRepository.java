package com.learntrack.risk.repository;

import com.learntrack.risk.domain.RiskAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, Long> {

    Optional<RiskAssessment> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    Optional<RiskAssessment> findByRiskIdAndTenantId(Long riskId, String tenantId);

    List<RiskAssessment> findByTenantId(String tenantId);

    List<RiskAssessment> findByTenantIdAndStatus(String tenantId, String status);
}
