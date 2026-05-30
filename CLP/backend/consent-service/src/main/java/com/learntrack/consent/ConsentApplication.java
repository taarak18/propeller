package com.learntrack.consent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.learntrack")
@EntityScan(basePackages = {"com.learntrack.consent", "com.learntrack.common.outbox"})
@EnableJpaRepositories(basePackages = {"com.learntrack.consent", "com.learntrack.common.outbox"})
public class ConsentApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConsentApplication.class, args);
    }
}
