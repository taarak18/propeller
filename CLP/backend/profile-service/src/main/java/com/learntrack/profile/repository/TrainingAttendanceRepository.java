package com.learntrack.profile.repository;

import com.learntrack.profile.model.TrainingAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** All finders are tenant-scoped (workspace rule 02). */
public interface TrainingAttendanceRepository extends JpaRepository<TrainingAttendance, Long> {

    List<TrainingAttendance> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    List<TrainingAttendance> findByTenantIdAndEmployeeIdAndSessionDateAndTrainingModule(
            String tenantId, String employeeId, String sessionDate, String trainingModule);
}
