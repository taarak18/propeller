package com.learntrack.reporting.repository;

import com.learntrack.reporting.domain.InterventionReadModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterventionReadModelRepository extends JpaRepository<InterventionReadModel, Long> {

    Optional<InterventionReadModel> findByTenantIdAndInterventionId(String tenantId, String interventionId);

    List<InterventionReadModel> findByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, String status);
}
