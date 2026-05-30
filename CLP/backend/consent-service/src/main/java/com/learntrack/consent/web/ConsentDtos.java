package com.learntrack.consent.web;

/** Request bodies for the consent REST API. */
public final class ConsentDtos {

    private ConsentDtos() {
    }

    public record UpsertRequest(
            String employeeId,
            String purpose,
            String action,
            String jurisdiction) {
    }
}
