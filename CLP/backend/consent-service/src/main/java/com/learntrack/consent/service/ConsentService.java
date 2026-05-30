package com.learntrack.consent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learntrack.common.outbox.OutboxPublisher;
import com.learntrack.consent.domain.Consent;
import com.learntrack.consent.domain.ConsentAudit;
import com.learntrack.consent.domain.ConsentStatus;
import com.learntrack.consent.repository.ConsentAuditRepository;
import com.learntrack.consent.repository.ConsentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Consent capture, withdrawal, audit and disclosure logic. Every query is scoped by tenantId. */
@Service
public class ConsentService {

    private static final Logger log = LoggerFactory.getLogger(ConsentService.class);

    private static final Map<String, Map<String, String>> DISCLOSURES = buildDisclosures();

    private final ConsentRepository consentRepository;
    private final ConsentAuditRepository auditRepository;
    private final OutboxPublisher outboxPublisher;
    private final ObjectMapper objectMapper;

    public ConsentService(ConsentRepository consentRepository,
                          ConsentAuditRepository auditRepository,
                          OutboxPublisher outboxPublisher,
                          ObjectMapper objectMapper) {
        this.consentRepository = consentRepository;
        this.auditRepository = auditRepository;
        this.outboxPublisher = outboxPublisher;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Consent> listForEmployee(String tenantId, String employeeId) {
        return consentRepository.findByTenantIdAndEmployeeId(tenantId, employeeId);
    }

    /** GRANT → consent.updated; WITHDRAW → consent.withdrawn. Upserts the record + writes audit. */
    @Transactional
    public Consent apply(String tenantId, String actorId, String employeeId, String purpose,
                         String action, String jurisdiction) {
        if (!ConsentPurposes.isValid(purpose)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown purpose: " + purpose);
        }
        if (action == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "action is required (GRANT|WITHDRAW)");
        }
        String act = action.trim().toUpperCase();
        if (act.equals("GRANT")) {
            return grant(tenantId, actorId, employeeId, purpose, jurisdiction);
        } else if (act.equals("WITHDRAW")) {
            return withdraw(tenantId, actorId, employeeId, purpose);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "action must be GRANT or WITHDRAW");
    }

    @Transactional
    public Consent grant(String tenantId, String actorId, String employeeId, String purpose, String jurisdiction) {
        Consent consent = consentRepository
                .findByTenantIdAndEmployeeIdAndPurpose(tenantId, employeeId, purpose)
                .orElseGet(Consent::new);
        consent.setTenantId(tenantId);
        consent.setEmployeeId(employeeId);
        consent.setPurpose(purpose);
        consent.setStatus(ConsentStatus.GRANTED);
        consent.setLegalBasis("consent");
        consent.setJurisdiction(jurisdiction);
        consent.setConsentedAt(Instant.now());
        consent.setWithdrawnAt(null);
        consent = consentRepository.save(consent);

        writeAudit(tenantId, actorId, employeeId, purpose, "GRANT");

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("employeeId", employeeId);
        payload.put("purpose", purpose);
        payload.put("status", "GRANTED");
        outboxPublisher.enqueue("consent.updated", tenantId, payload);
        return consent;
    }

    @Transactional
    public Consent withdraw(String tenantId, String actorId, String employeeId, String purpose) {
        if (!ConsentPurposes.isValid(purpose)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown purpose: " + purpose);
        }
        Consent consent = consentRepository
                .findByTenantIdAndEmployeeIdAndPurpose(tenantId, employeeId, purpose)
                .orElseGet(Consent::new);
        consent.setTenantId(tenantId);
        consent.setEmployeeId(employeeId);
        consent.setPurpose(purpose);
        consent.setStatus(ConsentStatus.WITHDRAWN);
        consent.setWithdrawnAt(Instant.now());
        consent = consentRepository.save(consent);

        writeAudit(tenantId, actorId, employeeId, purpose, "WITHDRAW");

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("employeeId", employeeId);
        payload.put("purpose", purpose);
        payload.put("riskProfilingOptOut", ConsentPurposes.RISK_PROFILING.equals(purpose));
        outboxPublisher.enqueue("consent.withdrawn", tenantId, payload);
        return consent;
    }

    private void writeAudit(String tenantId, String actorId, String employeeId, String purpose, String action) {
        ConsentAudit audit = new ConsentAudit();
        audit.setTenantId(tenantId);
        audit.setEmployeeId(employeeId);
        audit.setPurpose(purpose);
        audit.setAction(action);
        audit.setActorId(actorId);
        audit.setOccurredAt(Instant.now());
        auditRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public JsonNode disclosures(String jurisdiction) {
        String key = (jurisdiction == null || jurisdiction.isBlank())
                ? "GDPR" : jurisdiction.trim().toUpperCase();
        Map<String, String> texts = DISCLOSURES.getOrDefault(key, DISCLOSURES.get("GDPR"));
        ObjectNode node = objectMapper.createObjectNode();
        node.put("jurisdiction", DISCLOSURES.containsKey(key) ? key : "GDPR");
        ObjectNode purposes = node.putObject("purposes");
        texts.forEach(purposes::put);
        return node;
    }

    private static Map<String, Map<String, String>> buildDisclosures() {
        Map<String, String> gdpr = Map.of(
                ConsentPurposes.RISK_PROFILING,
                "We analyse your learning data to identify if you may be at risk of falling behind. "
                        + "This is automated profiling under GDPR Art.22; you may opt out at any time.",
                ConsentPurposes.ANONYMISED_BENCHMARKING,
                "Your anonymised metrics may be aggregated with peers for benchmarking. No individual is identifiable.",
                ConsentPurposes.ML_SCORING,
                "We use machine-learning models to predict learning outcomes. Lawful basis: your consent (GDPR Art.6(1)(a)).",
                ConsentPurposes.TRAINER_NOTES,
                "Your assigned trainer may record notes about your interventions to support your development.",
                ConsentPurposes.THIRD_PARTY_SHARING,
                "With your consent, learning outcomes may be shared with approved third-party providers.");

        Map<String, String> ccpa = Map.of(
                ConsentPurposes.RISK_PROFILING,
                "We profile your learning activity. Under CCPA/CPRA you have the right to opt out of this profiling.",
                ConsentPurposes.ANONYMISED_BENCHMARKING,
                "Aggregated, de-identified data is used for benchmarking; this is not a sale of personal information.",
                ConsentPurposes.ML_SCORING,
                "Automated decision-making technology is used to score learning risk. You may opt out.",
                ConsentPurposes.TRAINER_NOTES,
                "Trainers record development notes. You may request access to or deletion of this information.",
                ConsentPurposes.THIRD_PARTY_SHARING,
                "We do not sell your data. Sharing with third parties occurs only with your authorisation.");

        Map<String, String> dpdp = Map.of(
                ConsentPurposes.RISK_PROFILING,
                "Under the DPDP Act 2023 we process your personal data for risk profiling based on your consent.",
                ConsentPurposes.ANONYMISED_BENCHMARKING,
                "Anonymised data is used for benchmarking and is not personal data under the DPDP Act.",
                ConsentPurposes.ML_SCORING,
                "We use automated models for learning-risk scoring with your consent as the lawful ground.",
                ConsentPurposes.TRAINER_NOTES,
                "Trainer notes are processed to deliver the learning service you have signed up for.",
                ConsentPurposes.THIRD_PARTY_SHARING,
                "Data Principals' information is shared with Data Processors only under a valid contract and consent.");

        Map<String, String> pipeda = Map.of(
                ConsentPurposes.RISK_PROFILING,
                "Under PIPEDA / Quebec Law 25 we obtain your meaningful consent before profiling your learning risk.",
                ConsentPurposes.ANONYMISED_BENCHMARKING,
                "De-identified information is used for benchmarking in accordance with PIPEDA principles.",
                ConsentPurposes.ML_SCORING,
                "Automated decision systems are used for risk scoring; you will be informed and may opt out.",
                ConsentPurposes.TRAINER_NOTES,
                "Trainer notes are collected for the identified purpose of supporting your learning.",
                ConsentPurposes.THIRD_PARTY_SHARING,
                "Disclosure to third parties occurs only for purposes you have consented to.");

        return Map.of("GDPR", gdpr, "CCPA", ccpa, "DPDP", dpdp, "PIPEDA", pipeda);
    }
}
