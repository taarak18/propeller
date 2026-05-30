package com.learntrack.profile;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.learntrack")
@EntityScan(basePackages = {"com.learntrack.profile", "com.learntrack.common.outbox"})
@EnableJpaRepositories(basePackages = {"com.learntrack.profile", "com.learntrack.common.outbox"})
public class ProfileApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProfileApplication.class, args);
    }
}
