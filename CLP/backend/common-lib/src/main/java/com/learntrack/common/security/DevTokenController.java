package com.learntrack.common.security;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** POC-only endpoint to mint dev JWTs for the frontend dev-login. */
@RestController
public class DevTokenController {

    private final JwtService jwtService;

    public DevTokenController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public record DevTokenRequest(String userId, String tenantId, String name, List<String> roles) {}

    @PostMapping("/api/auth/dev-token")
    public Map<String, String> mint(@RequestBody DevTokenRequest req) {
        String token = jwtService.mint(
                req.userId() == null ? "u_dev" : req.userId(),
                req.tenantId() == null ? "tenant_acme_corp" : req.tenantId(),
                req.name() == null ? "Dev User" : req.name(),
                req.roles() == null ? List.of("LD_ADMIN") : req.roles());
        return Map.of("token", token);
    }
}
