package com.learntrack.intervention.web;

import java.time.LocalDate;

/** Request bodies for the intervention REST API. */
public final class InterventionDtos {

    private InterventionDtos() {
    }

    public record CreateRequest(
            String employeeId,
            String employeeName,
            String riskId,
            String interventionType,
            String description,
            LocalDate startDate,
            LocalDate endDate,
            Integer totalSessions,
            String assignedTrainer) {
    }

    public record LogSessionRequest(
            LocalDate sessionDate,
            Boolean attended,
            String notes) {
    }

    public record CompleteRequest(
            Double preValue,
            Double postValue) {
    }
}
