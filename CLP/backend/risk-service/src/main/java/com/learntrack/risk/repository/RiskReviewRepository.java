package com.learntrack.risk.repository;

import com.learntrack.risk.domain.RiskReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RiskReviewRepository extends JpaRepository<RiskReview, Long> {

    List<RiskReview> findByTenantIdAndRiskIdOrderByReviewIdAsc(String tenantId, Long riskId);

    boolean existsByTenantIdAndRiskIdAndDecision(String tenantId, Long riskId, String decision);

    long countByTenantIdAndDecision(String tenantId, String decision);
}
