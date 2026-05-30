package com.learntrack.risk.config;

import com.learntrack.risk.domain.RiskRule;
import com.learntrack.risk.repository.RiskRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/** Idempotently seeds a few default active rules per seed tenant on startup. */
@Component
public class RiskSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RiskSeedRunner.class);

    private static final List<String> SEED_TENANTS = List.of("tenant_acme_corp", "tenant_globex_ltd");

    private record SeedRule(String code, String name, String description, String severity, String definition) {
    }

    private static final List<SeedRule> DEFAULTS = List.of(
            new SeedRule("COMP_ATT", "Low Training Attendance",
                    "Attendance below 80% over the recent period.", "HIGH",
                    "{\"operator\":\"OR\",\"criteria\":[{\"metric\":\"training_attendance_percentage\","
                            + "\"period\":\"30_days\",\"operator\":\"less_than\",\"value\":80}]}"),
            new SeedRule("COMP_SCORE", "Low Competency Score",
                    "Average competency score below 60.", "CRITICAL",
                    "{\"operator\":\"AND\",\"criteria\":[{\"metric\":\"competency_average_score\","
                            + "\"operator\":\"less_than\",\"value\":60}]}"),
            new SeedRule("COMP_TREND", "Declining Score Trend",
                    "Assessment scores trending downward.", "MEDIUM",
                    "{\"operator\":\"OR\",\"criteria\":[{\"metric\":\"score_trend\","
                            + "\"operator\":\"equals\",\"value\":-1}]}")
    );

    private final RiskRuleRepository ruleRepository;

    public RiskSeedRunner(RiskRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String tenantId : SEED_TENANTS) {
            for (SeedRule seed : DEFAULTS) {
                String ruleId = tenantId + "_" + seed.code();
                if (ruleRepository.existsByRuleIdAndTenantId(ruleId, tenantId)) {
                    continue;
                }
                Instant now = Instant.now();
                RiskRule rule = new RiskRule();
                rule.setRuleId(ruleId);
                rule.setTenantId(tenantId);
                rule.setRuleName(seed.name());
                rule.setDescription(seed.description());
                rule.setSeverity(seed.severity());
                rule.setRuleDefinitionJson(seed.definition());
                rule.setActive(true);
                rule.setVersion(1);
                rule.setCreatedBy("system");
                rule.setCreatedAt(now);
                rule.setUpdatedAt(now);
                ruleRepository.save(rule);
                log.info("Seeded default rule {} for {}", ruleId, tenantId);
            }
        }
    }
}
