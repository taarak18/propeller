package com.learntrack.risk.repository;

import com.learntrack.risk.domain.RiskRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskRuleRepository extends JpaRepository<RiskRule, String> {

    List<RiskRule> findByTenantId(String tenantId);

    List<RiskRule> findByTenantIdAndActiveTrue(String tenantId);

    Optional<RiskRule> findByRuleIdAndTenantId(String ruleId, String tenantId);

    boolean existsByRuleIdAndTenantId(String ruleId, String tenantId);

    long countByTenantId(String tenantId);
}
