package com.learntrack.intervention.sla;

import com.learntrack.intervention.domain.Intervention;
import com.learntrack.intervention.domain.InterventionStatus;
import com.learntrack.intervention.repository.InterventionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * POC stand-in for the Temporal SLA timer: flips PENDING_APPROVAL interventions older than
 * the SLA window to ESCALATED. Runs as a system sweep across tenants (each row keeps its own
 * tenantId), mirroring the cross-tenant OutboxPoller pattern.
 */
@Component
public class SlaEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlaEscalationScheduler.class);
    private static final Duration SLA_WINDOW = Duration.ofMinutes(2);

    private final InterventionRepository interventionRepository;

    public SlaEscalationScheduler(InterventionRepository interventionRepository) {
        this.interventionRepository = interventionRepository;
    }

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void escalateStalePending() {
        Instant cutoff = Instant.now().minus(SLA_WINDOW);
        List<Intervention> pending = interventionRepository.findByStatus(InterventionStatus.PENDING_APPROVAL);
        for (Intervention iv : pending) {
            if (iv.getCreatedAt() != null && iv.getCreatedAt().isBefore(cutoff)) {
                iv.setStatus(InterventionStatus.ESCALATED);
                interventionRepository.save(iv);
                log.warn("SLA breach: escalated intervention id={} tenant={} employeeId={} (pending since {})",
                        iv.getId(), iv.getTenantId(), iv.getEmployeeId(), iv.getCreatedAt());
            }
        }
    }
}
