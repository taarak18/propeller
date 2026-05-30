package com.learntrack.reporting.repository;

import com.learntrack.reporting.domain.AlertItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertItemRepository extends JpaRepository<AlertItem, Long> {

    List<AlertItem> findByTenantIdOrderByOccurredAtDesc(String tenantId);
}
