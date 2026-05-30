package com.learntrack.reporting.repository;

import com.learntrack.reporting.domain.GeneratedReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GeneratedReportRepository extends JpaRepository<GeneratedReport, Long> {

    List<GeneratedReport> findByTenantIdOrderByGeneratedAtDesc(String tenantId);

    Optional<GeneratedReport> findByIdAndTenantId(Long id, String tenantId);
}
