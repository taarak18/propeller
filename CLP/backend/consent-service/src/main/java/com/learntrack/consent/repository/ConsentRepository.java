package com.learntrack.consent.repository;

import com.learntrack.consent.domain.Consent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsentRepository extends JpaRepository<Consent, Long> {

    List<Consent> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    Optional<Consent> findByTenantIdAndEmployeeIdAndPurpose(String tenantId, String employeeId, String purpose);
}
