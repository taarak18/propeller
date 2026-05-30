package com.learntrack.common.tenant;

import java.util.List;

/** Per-request tenant/user context populated by {@code JwtAuthFilter}. */
public final class TenantContext {

    public record Principal(String tenantId, String userId, String name, List<String> roles) {
        public boolean hasRole(String role) {
            return roles != null && roles.contains(role);
        }
    }

    private static final ThreadLocal<Principal> CTX = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Principal p) { CTX.set(p); }

    public static Principal get() { return CTX.get(); }

    public static String tenantId() {
        Principal p = CTX.get();
        return p == null ? null : p.tenantId();
    }

    public static String userId() {
        Principal p = CTX.get();
        return p == null ? null : p.userId();
    }

    public static void clear() { CTX.remove(); }
}
