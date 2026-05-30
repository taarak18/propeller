package com.learntrack.intervention.repository;

import com.learntrack.intervention.domain.InterventionSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterventionSessionRepository extends JpaRepository<InterventionSession, Long> {

    List<InterventionSession> findByTenantIdAndInterventionIdOrderBySessionDateAsc(String tenantId, Long interventionId);
}
