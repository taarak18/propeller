# 01 · System Design — Industry-Standard Cloud-Native Corporate Learning SaaS Platform

> **Platform-agnostic, multi-tenant SaaS** built on **industry-standard, cloud-portable technologies**. Greenfield blueprint — deployable on any major cloud, on-prem, or hybrid without code changes. The design names *technologies* (PostgreSQL, Redis, Kafka, Kubernetes), not vendor SKUs — each cloud's managed equivalent is a deployment-time choice.

---

## 1. Architecture Overview

The platform is deployed as a **multi-tenant SaaS application on Kubernetes** using a **microservices architecture**. Each of the 12 use cases maps to one or more independently deployable services. **Tenant isolation is enforced at every layer** — network (NetworkPolicies + service mesh), compute (namespace-per-environment), data (PostgreSQL Row-Level Security), and identity (OIDC/SAML provider with `tenant_id` claim in JWT).

### 1.1 Architecture Principles

```mermaid
mindmap
  root((Industry-Standard<br/>Cloud-Native<br/>Principles))
    Multi-Tenancy
      Row-Level Security in PostgreSQL
      Per-tenant API keys via API Gateway
      Identity provider realms or tenant claim
      Secrets store namespaces per tenant
    Industry-Standard Tooling
      Kubernetes for orchestration
      PostgreSQL + Redis + Kafka for data
      React + TypeScript on the frontend
      Recognized names at every layer
    Zero-Trust Security
      OIDC + SAML federation
      Secrets manager for all credentials
      mTLS between pods
      NetworkPolicies deny-by-default
    Observability
      Metrics, logs, traces
      OpenTelemetry instrumentation
      Commercial APM optional at the edge
    Cloud-Portable
      No vendor-locked APIs
      Helm + Kustomize manifests
      Managed services bound at deploy time
      Terraform/OpenTofu for IaC
```

### 1.2 The Four Pillars

| Pillar | Implementation | Tools |
|---|---|---|
| **Multi-Tenancy** | Shared cluster + per-tenant logical isolation | PostgreSQL RLS, API-gateway consumer plugins, IdP `tenant_id` claim, secrets-manager namespaces |
| **Industry-Standard Stack** | Container-first, declarative, immutable; technologies engineers and customers recognize | Kubernetes, PostgreSQL, Redis, Apache Kafka, Helm, React, TypeScript |
| **Zero-Trust Security** | "Never trust, always verify" | OIDC/SAML identity provider, secrets manager, service-mesh mTLS, OPA, NetworkPolicies, Falco |
| **Observability** | Three pillars: metrics, logs, traces | Prometheus, Grafana, Loki, Tempo, OpenTelemetry (with optional commercial APM/error tracking at the edge) |

---

## 2. Use Case → Service Mapping

| Use Case | Primary Services | Supporting Components |
|---|---|---|
| **UC-01** Tenant Onboarding | `tenant-svc` (Deployment), PostgreSQL | Kafka (provisioning events), secrets manager (secret injection), SMTP relay |
| **UC-02** Super Admin Manages Tenant | `admin-api` (Deployment), PostgreSQL | Prometheus alerts, Grafana dashboards |
| **UC-03** Manage Subscription Tier | `billing-svc` (Deployment), PostgreSQL | Kafka, commercial billing API (Stripe / Chargebee) |
| **UC-04** Configure Tenant SSO | Identity provider (realm/tenant config), secrets manager | `identity-svc`, OIDC/SAML federation |
| **UC-05** Ingest Training Data | API gateway, `ingestion-svc` | Kafka topics (per-tenant partition), PostgreSQL, Redis (idempotency) |
| **UC-06** View Employee Profile | `profile-svc` (Deployment), PostgreSQL | Redis cache, CDN for assets |
| **UC-07** Configure Risk Rule | `rules-svc` (Deployment), PostgreSQL | Object storage (rule JSON blobs), secrets manager |
| **UC-08** Identify At-Risk Learners | Argo Workflows + Knative jobs | Kafka, PostgreSQL, Notification dispatcher |
| **UC-09** Assign Intervention | `intervention-svc` (Deployment), PostgreSQL | Kafka, SMTP/SMS provider |
| **UC-10** Track Effectiveness | `analytics-svc` (Deployment), PostgreSQL | Reporting engine (e.g., ClickHouse / Trino), object storage |
| **UC-11** Generate Compliance Report | `report-svc` (Knative service), object storage | Argo Workflows, PostgreSQL |
| **UC-12** Role-Based Dashboard | `dashboard-api` (Deployment), Redis | PostgreSQL, CDN, WebSocket service (self-hosted or commercial) |

---

## 3. High-Level Architecture

```mermaid
flowchart TD
    subgraph CLIENTS["Client Layer"]
        B["React PWA<br/>Browser"]
        M["Android PWA<br/>Mobile"]
        ES["External Systems<br/>LMS / Attendance APIs"]
    end

    subgraph EDGE["Global Edge — CDN + WAF"]
        CDN["CDN<br/>(cloud-managed or<br/>independent vendor)"]
        WAF["WAF<br/>ModSecurity / OWASP CRS<br/>(or cloud-managed)"]
    end

    subgraph INGRESS["Ingress Layer"]
        NGINX["NGINX Ingress /<br/>Envoy Gateway"]
        CERT["cert-manager<br/>Let's Encrypt / ACME"]
    end

    subgraph GATEWAY["API Gateway"]
        KONG["Kong Gateway<br/>Rate Limiting · JWT<br/>Tenant Routing · API Keys"]
    end

    subgraph APP["Kubernetes Application Layer"]
        TS["Tenant Service<br/>UC-01 · UC-02 · UC-03"]
        IS["Identity Service<br/>UC-04 SSO bridge"]
        IG["Ingestion Service<br/>UC-05"]
        PS["Profile Service<br/>UC-06"]
        RS["Risk Rules Service<br/>UC-07"]
        RE["Risk Engine<br/>UC-08 Batch"]
        IV["Intervention Service<br/>UC-09 · UC-10"]
        RP["Report Service<br/>UC-11 PDF/Excel"]
        DS["Dashboard Service<br/>UC-12"]
        NS["Notification Service"]
        AS["Audit Service"]
        BS["Billing Service"]
        MESH["Istio / Linkerd<br/>mTLS · Traffic Mgmt"]
    end

    subgraph BATCH["Event & Batch Layer"]
        KAFKA["Apache Kafka<br/>Strimzi Operator"]
        KNATIVE["Knative Eventing /<br/>KEDA"]
        ARGO["Argo Workflows<br/>Risk Batch · Reports"]
    end

    subgraph DATA["Data Layer — Managed Service or K8s Operator"]
        PG["PostgreSQL<br/>(cloud-managed or<br/>CloudNativePG) · RLS · HA"]
        RD["Redis<br/>(cloud-managed or operator)"]
        OBJ["Object Storage<br/>S3-API (cloud-managed<br/>or MinIO)"]
        MONGO["MongoDB<br/>Audit Trail · Append-only"]
    end

    subgraph IDENTITY["Identity & Security"]
        KC["Identity Provider<br/>OIDC + SAML 2.0<br/>(Keycloak or commercial IdP)"]
        VAULT["Secrets Manager<br/>(HashiCorp Vault or<br/>cloud-managed)"]
        OPA["OPA Gatekeeper<br/>Policy Enforcement"]
    end

    subgraph OBS["Observability"]
        PROM["Prometheus + Thanos<br/>Metrics"]
        LOKI["Loki<br/>Logs"]
        TEMPO["Tempo / Jaeger<br/>Traces"]
        GRAF["Grafana<br/>Dashboards · Alerts"]
    end

    subgraph DEVOPS["GitOps / CI/CD"]
        ARGOCD["Argo CD<br/>GitOps CD"]
        TEKTON["GitHub Actions / Tekton<br/>CI Pipelines"]
        HARBOR["Container Registry<br/>(cloud-managed or Harbor)"]
    end

    B & M --> CDN
    ES --> CDN
    CDN --> WAF --> NGINX
    NGINX --> KONG
    CERT -.-> NGINX
    KONG --> TS & IS & IG & PS & RS & IV & RP & DS & AS & BS
    IG --> KAFKA
    RE --> KAFKA
    IV --> KAFKA
    RP --> KAFKA
    KAFKA --> NS
    KAFKA --> KNATIVE
    KNATIVE --> ARGO
    TS & IS & IG & PS & RS & RE & IV & RP & DS & AS & BS --> PG
    PS & DS & RS --> RD
    RP --> OBJ
    AS --> MONGO
    ARGO --> PG
    ARGO --> OBJ
    KAFKA --> PS
    IS --> KC
    VAULT -.-> TS & IS & IG & PS & RS & IV & RP & DS & AS & BS
    OPA -.-> APP
    MESH -.-> APP
    APP --> PROM
    APP --> LOKI
    APP --> TEMPO
    PROM & LOKI & TEMPO --> GRAF
    TEKTON --> HARBOR
    HARBOR --> ARGOCD
    ARGOCD --> APP

    classDef cl fill:#1e293b,color:#94a3b8,stroke:#475569
    classDef ed fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef in fill:#fde68a,color:#78350f,stroke:#d97706
    classDef gw fill:#fce7f3,color:#831843,stroke:#ec4899
    classDef ap fill:#dbeafe,color:#1e3a8a,stroke:#326ce5,stroke-width:2px
    classDef bt fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef dt fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef se fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef ob fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef dv fill:#f1f5f9,color:#1e293b,stroke:#64748b

    class B,M,ES cl
    class CDN,WAF ed
    class NGINX,CERT in
    class KONG gw
    class TS,IS,IG,PS,RS,RE,IV,RP,DS,NS,AS,BS,MESH ap
    class KAFKA,KNATIVE,ARGO bt
    class PG,RD,OBJ,MONGO dt
    class KC,VAULT,OPA se
    class PROM,LOKI,TEMPO,GRAF ob
    class ARGOCD,TEKTON,HARBOR dv
```

---

## 4. Multi-Tenancy Strategy

The platform supports a **shared-everything model with logical isolation** — the most cost-efficient approach for SaaS workloads.

### 4.1 Tenant Isolation Layers

```mermaid
flowchart TD
    REQ["Incoming Request<br/>(JWT with tenant_id)"]
    L1["Layer 1: Edge<br/>API Gateway rate-limit by tenant_id"]
    L2["Layer 2: Service Mesh<br/>Istio JWT validation + AuthorizationPolicy"]
    L3["Layer 3: Application<br/>tenant_id propagated via request context"]
    L4["Layer 4: Database<br/>PostgreSQL RLS:<br/>SET app.tenant_id = X"]
    L5["Layer 5: Storage<br/>Object-store bucket-per-tenant or<br/>prefix-per-tenant + IAM policy"]
    L6["Layer 6: Secrets<br/>Secrets-manager namespace per tenant<br/>or path-based policy"]
    L7["Layer 7: Observability<br/>Logs/Metrics tagged with tenant_id"]

    REQ --> L1 --> L2 --> L3 --> L4
    L3 --> L5
    L3 --> L6
    L3 --> L7

    classDef layer fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    class L1,L2,L3,L4,L5,L6,L7 layer
```

### 4.2 PostgreSQL RLS Pattern

```sql
-- Every tenant-scoped table:
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Application sets tenant context per request:
SET LOCAL app.tenant_id = '<tenant-uuid-from-jwt>';
```

### 4.3 Tenant Onboarding Flow (UC-01)

```mermaid
sequenceDiagram
    autonumber
    participant Admin as Super Admin
    participant API as tenant-svc
    participant IDP as Identity Provider
    participant SM as Secrets Manager
    participant DB as PostgreSQL
    participant K as Kafka
    participant N as Notification Svc

    Admin->>API: POST /api/v1/tenants {domain, tier, admin_email}
    API->>DB: INSERT INTO tenants (id, ...) RETURNING id
    API->>IDP: Create realm (or add user to shared realm with tenant_id)
    API->>SM: Write secret tenant/{id}/api-key
    API->>K: Publish event tenant.provisioned
    K->>N: Consume event
    N->>Admin: Send welcome email with admin credentials
    API-->>Admin: 201 Created {tenant_id, dashboard_url}
```

---

## 5. Subscription Tier Enforcement (UC-03)

Tier limits are enforced at **three independent layers** to prevent abuse:

| Tier | Max Employees | Max Risk Rules | API Rate Limit | Channels |
|---|---|---|---|---|
| **Basic** | 500 | 5 | 100 req/min | Email only |
| **Professional** | 5,000 | Unlimited | 1,000 req/min | Email + SMS + In-app |
| **Enterprise** | Unlimited | Unlimited | Unlimited (fair use) | All + Custom webhooks |

### Enforcement Layers

1. **API Gateway** — Rate-limiting plugin keyed by `tenant_id` from JWT.
2. **Application Service** — Checks tier from cached config; returns `403 TIER_LIMIT_EXCEEDED`.
3. **Database trigger** — Last line of defense; enforces hard limits on row counts.

```mermaid
flowchart LR
    REQ["API Request"] --> GW{API Gateway<br/>rate-limit plugin}
    GW -- "OK" --> SVC{App Service<br/>Tier Check}
    GW -- "429 Too Many" --> REJ1["Rejected at Gateway"]
    SVC -- "OK" --> DB{DB Trigger<br/>Hard Limit}
    SVC -- "403 Tier" --> REJ2["Rejected at App"]
    DB -- "OK" --> SUCCESS["Operation Succeeds"]
    DB -- "Quota Exceeded" --> REJ3["Rolled Back at DB"]

    classDef ok fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef rej fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    class SUCCESS ok
    class REJ1,REJ2,REJ3 rej
```

---

## 6. Key Design Decisions vs the Cloud-Coupled Draft

The original system design was sketched using a single vendor's managed services. We re-expressed each decision using **industry-standard, cloud-portable technologies** before any code was written. The recognition test was: *would an experienced engineer or enterprise buyer immediately recognize this technology?*

| Decision | Cloud-Coupled Draft (Vendor-Specific) | Industry-Standard Choice | Rationale |
|---|---|---|---|
| **Orchestrator** | Single-vendor container-apps platform | Kubernetes (+ Istio service mesh) | De-facto standard for container workloads; portable; massive talent pool |
| **Identity** | Vendor's B2C identity service | OIDC + SAML provider (Keycloak self-hosted, or commercial IdP) | Standard protocols; pick deployment model later |
| **NoSQL Audit** | Vendor-only document DB | MongoDB | Widely recognized; many managed and self-hosted options |
| **Object Storage** | Vendor-native blob store | S3-API object storage (cloud-managed or MinIO) | S3 API is the de-facto standard |
| **Messaging** | Vendor message broker + event hub | Apache Kafka | Single technology for both queueing and streaming; recognized industry standard |
| **Real-time** | Vendor-specific WebSocket service | WebSocket (self-hosted or commercial vendor) | Standard protocol; deployment is a choice |
| **Functions** | Vendor's FaaS | Knative + KEDA | Scale-to-zero semantics; K8s-native; portable |
| **CDN / WAF** | Vendor's bundled CDN+WAF | CDN + ModSecurity (cloud-managed or independent vendor) | Better PoP coverage from specialist CDN vendors |
| **Container Registry** | Vendor's registry | Cloud-managed OCI registry (or Harbor) | Standard OCI registries available everywhere |
| **CI/CD** | Vendor's DevOps suite | GitHub Actions + Argo CD (GitOps) | Modern GitOps; broader ecosystem; no vendor pipeline lock-in |

---

## 7. Deployment Targets

This identical design can be deployed to any of the following environments. Specific cloud-provider managed-service SKUs are bound at deployment time (see [`13-Multi-Cloud-Mapping.md`](./13-Multi-Cloud-Mapping.md)).

| Target | Kubernetes Distribution | Notes |
|---|---|---|
| **Public Cloud A / B / C** | Cloud-provider managed Kubernetes | Use the cloud's managed PostgreSQL / Redis / Kafka / object storage; bind to identical Helm values |
| **On-Prem** | Rancher / OpenShift / vanilla K8s / k3s | MetalLB for LoadBalancer; Longhorn / Rook-Ceph for storage |
| **Hybrid** | Cluster API + Argo CD multi-cluster | Primary in cloud, DR on-prem (or vice versa) |
| **Edge** | k3s on small clusters | For air-gapped customer deployments |

All deployment targets use **identical Helm charts / Kustomize manifests** — only the underlying infrastructure differs.

---

## 8. SLA Targets

| Metric | Target | How Achieved |
|---|---|---|
| API Response (P95) | <200ms | HPA + KEDA scaling, Redis caching, read replicas |
| Dashboard Load | <2s | Redis cache + CDN for static assets |
| Platform Uptime | >99.9% | Multi-AZ pods, PodDisruptionBudgets, multi-region failover |
| Risk Batch Completion | <2hr window | Argo Workflows parallel processing per tenant |
| Report Generation | <30s | Knative scale-out + async generation via Argo |
| Data Ingestion | 10,000 records/min | Kafka with 10 partitions + KEDA consumer scaling |
| DB Query (P99) | <100ms | PgBouncer + read replicas + query optimization |

---

## Next Steps

- See [`02-Architecture-Diagrams.md`](./02-Architecture-Diagrams.md) for detailed per-layer diagrams.
- See [`03-Microservices-Architecture.md`](./03-Microservices-Architecture.md) for service-by-service breakdown.
- See [`13-Multi-Cloud-Mapping.md`](./13-Multi-Cloud-Mapping.md) for cloud-provider managed-service mappings at deployment time.
- See [`14-Technology-Choice-Reference.md`](./14-Technology-Choice-Reference.md) for the decision-time reference when picking any individual technology.
