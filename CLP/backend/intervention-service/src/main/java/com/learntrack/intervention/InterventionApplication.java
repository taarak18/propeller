package com.learntrack.intervention;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.learntrack")
@EntityScan(basePackages = {"com.learntrack.intervention", "com.learntrack.common.outbox"})
@EnableJpaRepositories(basePackages = {"com.learntrack.intervention", "com.learntrack.common.outbox"})
public class InterventionApplication {
    public static void main(String[] args) {
        SpringApplication.run(InterventionApplication.class, args);
    }
}
