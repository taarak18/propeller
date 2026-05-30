package com.learntrack.risk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.learntrack")
@EntityScan(basePackages = {"com.learntrack.risk", "com.learntrack.common.outbox"})
@EnableJpaRepositories(basePackages = {"com.learntrack.risk", "com.learntrack.common.outbox"})
public class RiskApplication {
    public static void main(String[] args) {
        SpringApplication.run(RiskApplication.class, args);
    }
}
