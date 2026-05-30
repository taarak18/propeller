package com.learntrack.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;

/** Mints and validates dev HS256 JWTs (POC only). */
@Component
public class JwtService {

    private final SecretKey key;

    public JwtService(@Value("${learntrack.jwt.secret:learntrack-poc-dev-secret-change-me-please-32b}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String mint(String userId, String tenantId, String name, List<String> roles) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId)
                .claim("tenant_id", tenantId)
                .claim("name", name)
                .claim("roles", roles)
                .issuedAt(new Date(now))
                .expiration(new Date(now + 1000L * 60 * 60 * 12))
                .signWith(key)
                .compact();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parse(String token) {
        Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return Map.of(
                "userId", c.getSubject(),
                "tenantId", String.valueOf(c.get("tenant_id")),
                "name", String.valueOf(c.getOrDefault("name", "")),
                "roles", c.getOrDefault("roles", List.of())
        );
    }
}
