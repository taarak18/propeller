package com.learntrack.consent.service;

import java.util.Set;

/** The fixed set of processing purposes recognised by the platform (see CONTRACTS.md §4). */
public final class ConsentPurposes {

    public static final String RISK_PROFILING = "risk_profiling";
    public static final String ANONYMISED_BENCHMARKING = "anonymised_benchmarking";
    public static final String ML_SCORING = "ml_scoring";
    public static final String TRAINER_NOTES = "trainer_notes";
    public static final String THIRD_PARTY_SHARING = "third_party_sharing";

    public static final Set<String> ALL = Set.of(
            RISK_PROFILING, ANONYMISED_BENCHMARKING, ML_SCORING, TRAINER_NOTES, THIRD_PARTY_SHARING);

    private ConsentPurposes() {
    }

    public static boolean isValid(String purpose) {
        return purpose != null && ALL.contains(purpose);
    }
}
