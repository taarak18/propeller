# 05 · Security & Identity Architecture

> **Zero-Trust** model: never trust, always verify. Every workload, request, and secret is authenticated and authorized at every hop.

---

## 1. Security Layers

```mermaid
flowchart TD
    subgraph EDGE_SEC["Layer 1: Edge"]
        E1["DDoS Protection<br/>(CDN-native)"]
        E2["WAF<br/>ModSecurity + OWASP CRS"]
        E3["Bot Management<br/>(CDN vendor or cloud-managed)"]
    end

    subgraph PERIM_SEC["Layer 2: Cluster Perimeter"]
        P1["LoadBalancer SG<br/>(only 443 + health)"]
        P2["TLS 1.3 termination<br/>cert-manager + Let's Encrypt"]
        P3["NGINX Ingress<br/>request size limits"]
    end

    subgraph GW_SEC["Layer 3: API Gateway"]
        G1["JWT validation"]
        G2["API key auth<br/>for external systems"]
        G3["Rate limiting<br/>per tenant_id"]
        G4["Request validation<br/>OpenAPI schema"]
    end

    subgraph MESH_SEC["Layer 4: Service Mesh"]
        M1["Istio: mTLS STRICT<br/>between all pods"]
        M2["Istio: AuthorizationPolicy<br/>per service"]
        M3["SPIFFE/SPIRE workload identity"]
    end

    subgraph APP_SEC["Layer 5: Application"]
        A1["OPA: fine-grained authZ"]
        A2["RBAC enforcement<br/>per endpoint"]
        A3["Input validation<br/>schema + sanitization"]
    end

    subgraph DATA_SEC["Layer 6: Data"]
        D1["PostgreSQL RLS"]
        D2["Object-store bucket policies"]
        D3["Secrets-manager injection"]
        D4["Encryption at rest<br/>(cloud KMS or Vault Transit)"]
    end

    subgraph RUNTIME_SEC["Layer 7: Runtime"]
        R1["Falco: runtime detection"]
        R2["Kyverno: admission control"]
        R3["Trivy: image scanning"]
        R4["NetworkPolicy: deny-all default"]
    end

    EDGE_SEC --> PERIM_SEC --> GW_SEC --> MESH_SEC --> APP_SEC --> DATA_SEC
    RUNTIME_SEC -.-> APP_SEC

    classDef edge fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef perim fill:#fce7f3,color:#831843,stroke:#ec4899
    classDef gw fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef mesh fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef app fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef data fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef runtime fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class E1,E2,E3 edge
    class P1,P2,P3 perim
    class G1,G2,G3,G4 gw
    class M1,M2,M3 mesh
    class A1,A2,A3 app
    class D1,D2,D3,D4 data
    class R1,R2,R3,R4 runtime
```

---

## 2. Identity Management

The platform uses **standard identity protocols** — OIDC and SAML 2.0 — so the choice of Identity Provider (IdP) is interchangeable. The default reference implementation is **Keycloak** (self-hosted, open-source, no per-MAU pricing), but the same application code works against any compliant commercial IdP.

### 2.1 Identity Provider Options

| Option | Best For | Pricing Model | Operational Burden |
|---|---|---|---|
| **Keycloak (self-hosted)** *(reference)* | Cost-sensitive, sovereign deployments, on-prem customers | Free (infra cost only) | Operate cluster yourself |
| **Commercial B2B IdP** (e.g., Auth0, WorkOS, FrontEgg, Okta) | Fastest time-to-market, strong customer-confidence signal | Per-MAU or per-connection | Vendor handles ops |
| **Cloud-provider managed IdP** (Cognito / Identity Platform / Entra External ID) | When already heavily invested in one cloud | Per-MAU | Vendor handles ops |

> The application is coded against **OIDC + SAML 2.0** — switching IdPs requires configuration, not code changes.

### 2.2 Why Keycloak as the Reference Default

| Feature | Keycloak | Typical Commercial B2B IdP |
|---|---|---|
| Self-hosted | Yes (free) | No (vendor-hosted) |
| SAML 2.0 | Native | Native |
| OIDC | Native | Native |
| Social Login (Google, MS, FB, etc.) | Native | Native |
| Identity Brokering (federation) | Native, unlimited IdPs | Native (often capped by tier) |
| Custom claims via mappers | UI + scripts | UI + actions/hooks |
| Multi-tenancy | Realms or shared realm + claim | Organizations / tenants |
| Pricing | Free | Per-MAU or per-connection |
| Vendor lock-in | None (OSS) | Vendor-specific data export |
| Hiring | Solid talent pool | Easier — broader recognition |

### 2.3 Multi-Tenancy Strategies

**Two valid approaches:**

#### Option A: Shared Realm + `tenant_id` Claim (RECOMMENDED)

```mermaid
flowchart TB
    subgraph KC["Keycloak"]
        REALM["learning-platform realm"]
        USERS["Users<br/>(all tenants in one realm)"]
        IDP1["IdP: tenant-acme-saml"]
        IDP2["IdP: tenant-globex-oidc"]
        IDP3["IdP: tenant-initech-saml"]
        MAPPER["User Attribute Mapper:<br/>tenant_id → JWT claim"]
    end

    USERS --> MAPPER
    IDP1 --> USERS
    IDP2 --> USERS
    IDP3 --> USERS

    classDef realm fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef idp fill:#fef3c7,color:#92400e,stroke:#92400e
    classDef map fill:#dcfce7,color:#14532d,stroke:#16a34a

    class REALM,USERS realm
    class IDP1,IDP2,IDP3 idp
    class MAPPER map
```

**Pros:**
- Single realm to operate (simpler)
- Cross-tenant analytics in one place
- Easier to upgrade Keycloak version
- Lower memory footprint

**Cons:**
- Tenant must be tagged on every user (mandatory custom attribute)
- One misconfigured mapper exposes cross-tenant data

#### Option B: Realm per Tenant

**Pros:**
- Hard isolation at Keycloak level
- Per-tenant theming and login flows easy
- Per-tenant admin delegation

**Cons:**
- Realm sprawl (1,000 tenants = 1,000 realms)
- Higher Keycloak memory footprint
- Slower realm metadata cache invalidation

### 2.4 JWT Token Structure

```json
{
  "iss": "https://auth.platform.com/realms/learning-platform",
  "sub": "abc-123-keycloak-user-id",
  "aud": ["learning-platform-api"],
  "exp": 1735690000,
  "iat": 1735686400,
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane.doe@acme.com",
  "name": "Jane Doe",
  "roles": ["LD_ADMIN", "TRAINER"],
  "tier": "PROFESSIONAL",
  "preferred_username": "jane.doe"
}
```

### 2.5 Authentication Flows

| Flow | When Used | Standard |
|---|---|---|
| **Authorization Code + PKCE** | SPA / mobile login | OIDC |
| **Client Credentials** | Service-to-service inside cluster | OAuth 2.0 |
| **Refresh Token Rotation** | Long-lived sessions | OIDC |
| **Token Exchange** | Backend-to-backend impersonation (audit) | RFC 8693 |
| **Device Code Flow** | CLI tools, embedded devices | RFC 8628 |

### 2.6 MFA Enforcement

```mermaid
flowchart LR
    LOGIN["User Login"]
    ROLE{Role?}
    MFA["TOTP / WebAuthn<br/>required"]
    OK["Token issued"]

    LOGIN --> ROLE
    ROLE -->|"L&D Admin /<br/>Super Admin /<br/>Compliance Officer"| MFA --> OK
    ROLE -->|"Trainer / Employee /<br/>Manager"| OK

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef mfa fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef ok fill:#dcfce7,color:#14532d,stroke:#16a34a

    class LOGIN,ROLE step
    class MFA mfa
    class OK ok
```

Configured via Keycloak **Authentication Flow** with conditional MFA step based on role.

---

## 3. Secrets Management

Secrets management is an industry-standard requirement. The platform supports two deployment patterns, configurable per environment:

| Option | Best For |
|---|---|
| **Cloud-provider managed secrets store** *(simpler default)* | Single-cloud deployments — no operational burden |
| **HashiCorp Vault (self-hosted)** *(reference implementation)* | Multi-cloud, hybrid, on-prem, sovereign deployments; rich features (dynamic creds, PKI, transit encryption) |

Application code reads secrets via the **External Secrets Operator (ESO)** or **Vault Agent sidecar** — both abstractions work against either backend. Switching between the two is a configuration change, not a code change.

### 3.1 Why Vault (for the self-hosted reference path)

- Centralized secret storage with strong auth (K8s ServiceAccount, AppRole, OIDC, JWT)
- **Dynamic secrets** — generate short-lived DB credentials on demand
- **Encryption-as-a-service** (Transit secret engine)
- **PKI engine** — issue short-lived TLS certs to workloads
- **Audit logging** — every secret access logged
- Industry-standard tool with strong commercial support (HashiCorp / IBM)

### 3.2 Vault Topology

```mermaid
flowchart TB
    subgraph VAULT_CLUSTER["Vault Cluster (HA)"]
        V1["Vault Active<br/>(Zone A)"]
        V2["Vault Standby<br/>(Zone B)"]
        V3["Vault Standby<br/>(Zone C)"]
        RAFT["Integrated Raft<br/>Storage"]
        V1 -.-> RAFT
        V2 -.-> RAFT
        V3 -.-> RAFT
    end

    subgraph CLIENTS["Vault Clients"]
        AGENT["Vault Agent Sidecar<br/>(per pod)"]
        ESO["External Secrets<br/>Operator"]
        K8S_AUTH["K8s Auth Method<br/>(ServiceAccount JWT)"]
    end

    subgraph BACKENDS["Secret Engines"]
        KV["KV v2<br/>(static secrets)"]
        DB["Database<br/>(dynamic creds)"]
        PKI["PKI<br/>(TLS certs)"]
        TRANSIT["Transit<br/>(encryption)"]
    end

    AGENT --> V1
    ESO --> V1
    K8S_AUTH -.-> V1
    V1 --> KV & DB & PKI & TRANSIT

    classDef vault fill:#1e293b,color:#fef08a,stroke:#facc15
    classDef client fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef engine fill:#fef3c7,color:#92400e,stroke:#f59e0b

    class V1,V2,V3,RAFT vault
    class AGENT,ESO,K8S_AUTH client
    class KV,DB,PKI,TRANSIT engine
```

### 3.3 Secret Paths

| Path | Content | Access Policy |
|---|---|---|
| `secret/data/tenants/{id}/api-key` | Per-tenant API key (UC-05) | `ingestion-svc` ServiceAccount only |
| `secret/data/postgres/app` | DB user credentials | All app services |
| `secret/data/redis/connection` | Redis connection string | Profile, dashboard, rules services |
| `secret/data/tenants/{id}/sso-secret` | OIDC client secret (UC-04) | `identity-svc` only |
| `secret/data/billing/stripe-webhook` | Stripe webhook signing key | `billing-svc` only |
| `secret/data/report-signing-key` | RSA private key | `report-svc` only |
| `database/creds/app-readonly` | Dynamic Postgres role (TTL 1h) | Reporting services |
| `pki/issue/internal-mtls` | Workload TLS cert (TTL 24h) | All services (Istio fallback) |

### 3.4 Secret Injection Pattern

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenant-svc
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "tenant-svc"
        vault.hashicorp.com/agent-inject-secret-db: "secret/data/postgres/app"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "secret/data/postgres/app" -}}
          postgres://{{ .Data.data.user }}:{{ .Data.data.password }}@pg-rw.data:5432/learning
          {{- end -}}
    spec:
      serviceAccountName: tenant-svc
      containers:
        - name: app
          env:
            - name: DATABASE_URL_FILE
              value: /vault/secrets/db
```

The Vault Agent sidecar writes the rendered secret to `/vault/secrets/db` — the app reads it from there. **No secret ever appears in environment variables or git.**

---

## 4. Authorization — OPA / OPA Gatekeeper

### 4.1 Two Use Cases

| Layer | Tool | Purpose |
|---|---|---|
| **Cluster Admission** | OPA Gatekeeper | Validate K8s manifests at apply-time (no privileged pods, required labels, etc.) |
| **Application AuthZ** | OPA (sidecar or library) | Fine-grained "can user X do action Y on resource Z" |

### 4.2 Gatekeeper Example — Block Privileged Containers

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8spsprivileged
spec:
  crd:
    spec:
      names:
        kind: K8sPSPrivileged
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8spsprivileged
        violation[{"msg": msg}] {
          c := input.review.object.spec.containers[_]
          c.securityContext.privileged
          msg := sprintf("Privileged container not allowed: %v", [c.name])
        }
```

### 4.3 Application AuthZ Example — Intervention Approval

```rego
package learning.intervention

# Only L&D Admins can approve interventions
default allow := false

allow if {
  input.action == "approve"
  input.resource.type == "intervention"
  "LD_ADMIN" in input.user.roles
  input.resource.tenant_id == input.user.tenant_id
  input.resource.status == "PENDING_APPROVAL"
}
```

App service calls OPA:
```python
result = opa.evaluate(
    "learning/intervention/allow",
    {"action": "approve", "resource": intervention, "user": current_user}
)
if not result:
    raise Forbidden()
```

---

## 5. Network Security

### 5.1 NetworkPolicy Strategy

Every namespace has a **default deny-all** policy, then explicit allows.

```yaml
# Default deny all ingress + egress in app namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: app
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]

---
# Allow gateway → app
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-gateway
  namespace: app
spec:
  podSelector: {}
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels: { name: gateway }
      ports:
        - protocol: TCP
          port: 8080

---
# Allow app → data (PostgreSQL)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-to-data-pg
  namespace: app
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels: { name: data }
          podSelector:
            matchLabels: { app: postgresql }
      ports:
        - protocol: TCP
          port: 5432
```

### 5.2 Service Mesh mTLS

Istio `PeerAuthentication` enforces mTLS cluster-wide:

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
```

### 5.3 Network Topology

```mermaid
flowchart TB
    INTERNET(["Internet"])

    subgraph CLUSTER["Kubernetes Cluster — Calico / Cilium CNI"]
        direction TB

        subgraph NS_INGRESS["ns: ingress<br/>(public-facing)"]
            ING["NGINX Ingress"]
        end

        subgraph NS_GATEWAY["ns: gateway"]
            KONG["Kong"]
        end

        subgraph NS_APP["ns: app<br/>NetworkPolicy: deny-all default<br/>Allow: from gateway only"]
            APPS["12 Microservices"]
        end

        subgraph NS_BATCH["ns: batch"]
            BATCH["Argo Workflows<br/>Knative Workers"]
        end

        subgraph NS_DATA["ns: data<br/>NetworkPolicy: deny all<br/>Allow: from app+batch only"]
            DATA["PostgreSQL, Redis<br/>MinIO, MongoDB, Kafka"]
        end

        subgraph NS_SEC["ns: security<br/>NetworkPolicy: explicit allows"]
            SEC["Keycloak, Vault, OPA"]
        end
    end

    INTERNET --> ING --> KONG
    KONG -.->|"mTLS"| APPS
    APPS -.->|"mTLS"| DATA
    APPS -.->|"mTLS"| SEC
    BATCH -.->|"mTLS"| DATA

    classDef ext fill:#1e293b,color:#94a3b8,stroke:#475569
    classDef pub fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef gw fill:#fce7f3,color:#831843,stroke:#ec4899
    classDef app fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef batch fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef data fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef sec fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class INTERNET ext
    class ING pub
    class KONG gw
    class APPS app
    class BATCH batch
    class DATA data
    class SEC sec
```

---

## 6. Encryption

| Type | At Rest | In Transit |
|---|---|---|
| **PostgreSQL** | Storage encryption (cloud-managed disk encryption or LUKS) + optional column-level encryption via Vault Transit | TLS to clients, SSL to replicas |
| **Redis** | Storage encryption + optional Vault Transit | TLS to clients |
| **Object Storage** | Server-side encryption (SSE-S3 / SSE-KMS) | TLS to clients |
| **MongoDB** | WiredTiger encryption + KMS | TLS to clients |
| **Kafka** | Broker disk encryption | TLS to clients + brokers |
| **Backups** | Same as source + additional GPG/Vault encryption | TLS to backup target |
| **Service Mesh** | N/A | mTLS via Istio/SPIRE |

### Key Management

- **Cloud KMS** — use the chosen cloud provider's managed key service for disk encryption keys.
- **Vault Transit Engine** *(or cloud-managed KMS encryption-as-a-service)* — for application-level field encryption (e.g., PII in audit logs).
- **cert-manager** — for TLS certs (Let's Encrypt for external, self-signed CA for internal).

---

## 7. Runtime Security — Falco

Detects suspicious activity in real-time:

```yaml
# Custom Falco rule: detect privilege escalation in app pods
- rule: Privilege Escalation in App Pod
  desc: Detect privilege escalation in application pods
  condition: >
    proc.name in (sudo, su, doas) and
    container.image.repository startswith "harbor.platform.com/learning/"
  output: >
    Privilege escalation in app pod (user=%user.name command=%proc.cmdline
    container=%container.name pod=%k8s.pod.name)
  priority: WARNING
  tags: [process, mitre_privilege_escalation]
```

Falco events flow to Loki + Alertmanager → PagerDuty for critical events.

---

## 8. Image Security

```mermaid
flowchart LR
    DEV["Developer<br/>git push"]
    BUILD["Tekton / GH Actions<br/>docker build"]
    TRIVY["Trivy: scan<br/>(CVE check)"]
    SBOM["Generate SBOM<br/>(CycloneDX / SPDX)"]
    SIGN["Cosign: sign image"]
    PUSH["Push to Harbor"]
    GATEKEEPER["Gatekeeper:<br/>verify signature<br/>at admission"]
    K8S["Kubernetes:<br/>pull + run"]

    DEV --> BUILD --> TRIVY
    TRIVY -- "no critical CVEs" --> SBOM --> SIGN --> PUSH --> GATEKEEPER
    TRIVY -- "critical CVE<br/>found" --> REJECT["BLOCK"]
    GATEKEEPER -- "valid sig" --> K8S
    GATEKEEPER -- "no sig" --> DENY["DENY"]

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef ok fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef fail fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class DEV,BUILD,TRIVY,SBOM,SIGN,PUSH,GATEKEEPER step
    class K8S ok
    class REJECT,DENY fail
```

---

## 9. Compliance & Audit

| Requirement | Implementation |
|---|---|
| **SOC 2 Type II** | Falco runtime logs + Loki + retention; audit trail in MongoDB; access logs from Kong + Istio |
| **GDPR (Right to Erasure)** | Per-tenant data delete: PostgreSQL `DELETE WHERE tenant_id=?` (CASCADE) + MinIO bucket purge + Kafka tombstone records |
| **HIPAA (US healthcare tenants)** | Vault Transit encryption for PHI columns + audit log of every access |
| **ISO 27001** | Documented policies in Git; access reviews via Keycloak group export; quarterly Trivy + Defender scans |
| **PCI-DSS (if storing card data)** | Don't — delegate to Stripe/Chargebee with tokenization |

---

## 10. Security Operations

### 10.1 Incident Response Flow

```mermaid
flowchart LR
    DETECT["Detection<br/>(Falco / Prometheus / Loki)"]
    TRIAGE["Triage<br/>(on-call engineer)"]
    CONTAIN["Containment<br/>(NetworkPolicy block,<br/>revoke tokens)"]
    INVESTIGATE["Investigation<br/>(audit logs + traces)"]
    REMEDIATE["Remediation<br/>(patch + redeploy)"]
    POSTMORTEM["Post-mortem<br/>(blameless)"]

    DETECT --> TRIAGE --> CONTAIN --> INVESTIGATE --> REMEDIATE --> POSTMORTEM

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    class DETECT,TRIAGE,CONTAIN,INVESTIGATE,REMEDIATE,POSTMORTEM step
```

### 10.2 Secret Rotation

- **DB credentials:** Vault dynamic secrets — every workload gets a fresh credential on pod startup, TTL 1h.
- **API keys:** Quarterly rotation enforced by `tenant-svc` cron job.
- **JWT signing keys:** Keycloak rotates automatically every 90 days; old keys remain trusted for 30 days for token validation.
- **TLS certs:** cert-manager renews 30 days before expiry; Istio mesh certs rotated every 24h.
