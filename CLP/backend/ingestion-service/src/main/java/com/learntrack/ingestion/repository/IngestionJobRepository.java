package com.learntrack.ingestion.repository;

import com.learntrack.ingestion.model.IngestionJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** All finders are tenant-scoped (workspace rule 02). */
public interface IngestionJobRepository extends JpaRepository<IngestionJob, Long> {

    Optional<IngestionJob> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);

    List<IngestionJob> findTop50ByTenantIdOrderByCreatedAtDesc(String tenantId);
}
