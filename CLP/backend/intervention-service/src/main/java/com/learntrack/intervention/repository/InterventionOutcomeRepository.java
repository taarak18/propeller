package com.learntrack.intervention.repository;

import com.learntrack.intervention.domain.InterventionOutcome;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterventionOutcomeRepository extends JpaRepository<InterventionOutcome, Long> {

    List<InterventionOutcome> findByTenantIdAndInterventionId(String tenantId, Long interventionId);
}
