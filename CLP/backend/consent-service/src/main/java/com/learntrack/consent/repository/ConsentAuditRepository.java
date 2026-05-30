package com.learntrack.consent.repository;

import com.learntrack.consent.domain.ConsentAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsentAuditRepository extends JpaRepository<ConsentAudit, Long> {

    List<ConsentAudit> findByTenantIdAndEmployeeIdOrderByOccurredAtDesc(String tenantId, String employeeId);
}
