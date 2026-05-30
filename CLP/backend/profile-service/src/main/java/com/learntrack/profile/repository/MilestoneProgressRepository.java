package com.learntrack.profile.repository;

import com.learntrack.profile.model.MilestoneProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** All finders are tenant-scoped (workspace rule 02). */
public interface MilestoneProgressRepository extends JpaRepository<MilestoneProgress, Long> {

    List<MilestoneProgress> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    List<MilestoneProgress> findByTenantIdAndEmployeeIdAndMilestoneName(
            String tenantId, String employeeId, String milestoneName);
}
