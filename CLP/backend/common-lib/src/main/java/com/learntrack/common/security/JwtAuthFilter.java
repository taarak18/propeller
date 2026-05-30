package com.learntrack.common.security;

import com.learntrack.common.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Validates the dev JWT and populates {@link TenantContext}. POC stand-in for Kong JWKS validation.
 * Permits unauthenticated access to /actuator/**, /api/auth/dev-token and CORS preflight.
 */
@Component
@Order(1)
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String path = req.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())
                || path.startsWith("/actuator")
                || path.equals("/api/auth/dev-token")) {
            chain.doFilter(req, res);
            return;
        }

        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing bearer token");
            return;
        }
        try {
            Map<String, Object> claims = jwtService.parse(auth.substring(7));
            List<String> roles = (List<String>) claims.getOrDefault("roles", List.of());
            TenantContext.Principal p = new TenantContext.Principal(
                    (String) claims.get("tenantId"),
                    (String) claims.get("userId"),
                    (String) claims.get("name"),
                    roles);
            TenantContext.set(p);
            req.setAttribute("X-Tenant-ID", p.tenantId());
            req.setAttribute("X-User-ID", p.userId());
            req.setAttribute("X-Roles", roles);
            chain.doFilter(req, res);
        } catch (Exception e) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        } finally {
            TenantContext.clear();
        }
    }
}
