package com.learntrack.ingestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.learntrack")
@EntityScan(basePackages = {"com.learntrack.ingestion", "com.learntrack.common.outbox"})
@EnableJpaRepositories(basePackages = {"com.learntrack.ingestion", "com.learntrack.common.outbox"})
public class IngestionApplication {
    public static void main(String[] args) {
        SpringApplication.run(IngestionApplication.class, args);
    }
}
