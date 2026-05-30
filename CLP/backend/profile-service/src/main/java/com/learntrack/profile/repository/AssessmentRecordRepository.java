package com.learntrack.profile.repository;

import com.learntrack.profile.model.AssessmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** All finders are tenant-scoped (workspace rule 02). */
public interface AssessmentRecordRepository extends JpaRepository<AssessmentRecord, Long> {

    List<AssessmentRecord> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    List<AssessmentRecord> findByTenantIdAndEmployeeIdAndAssessmentNameAndAssessmentDate(
            String tenantId, String employeeId, String assessmentName, String assessmentDate);
}
