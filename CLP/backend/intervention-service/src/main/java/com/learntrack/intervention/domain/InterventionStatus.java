package com.learntrack.intervention.domain;

/** Lifecycle states for an intervention (see CONTRACTS.md §4 intervention-service). */
public enum InterventionStatus {
    RECOMMENDED,
    PENDING_APPROVAL,
    ACTIVE,
    COMPLETED,
    EVALUATED,
    CANCELLED,
    ESCALATED,
    REJECTED
}
