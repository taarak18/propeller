package com.learntrack.intervention.repository;

import com.learntrack.intervention.domain.Intervention;
import com.learntrack.intervention.domain.InterventionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    List<Intervention> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<Intervention> findByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, InterventionStatus status);

    Optional<Intervention> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndRiskIdAndStatus(String tenantId, String riskId, InterventionStatus status);

    long countByTenantIdAndStatus(String tenantId, InterventionStatus status);

    List<Intervention> findByStatus(InterventionStatus status);
}
