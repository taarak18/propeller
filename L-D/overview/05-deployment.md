# Deployment Architecture

# Deployment Architecture — SaaS Multi-Tenant

## Global Infrastructure Overview

```mermaid
graph TB
    subgraph Global["Global — Shared Platform Layer"]
        DNS[Route 53 / Azure DNS\nGlobal DNS + Health routing]
        CDN[CloudFront / Akamai\nCDN — Static assets]
        WAF[WAF\nOWASP Core Rules + DDoS]
        GW[API Gateway\nKong / AWS API GW\nTenant routing · Rate limiting]
    end

    subgraph US["Region: US-East-1 (Primary)"]
        subgraph US_PLAT["Platform Services Namespace"]
            US_AUTH[Auth Service]
            US_TMS[Tenant Management Service]
            US_NOTIF[Notification Service]
            US_AUDIT[Audit Service]
        end
        subgraph US_SHARED["Shared App Namespace — Starter + Pro"]
            US_ING[Ingestion Service]
            US_PROF[Profile Service]
            US_RISK[Risk Engine]
            US_INT[Intervention Service]
            US_RPT[Reporting Service]
            US_RULE[Rule Management]
        end
        subgraph US_ENT["Enterprise Tenant Namespaces"]
            ENT_A[tenant-acme-corp\nDedicated pods + DB]
            ENT_B[tenant-district-01\nDedicated pods + DB]
        end
        US_KAFKA[Kafka Cluster\n3 brokers]
        US_PG[PostgreSQL\nPrimary + 2 Replicas]
        US_REDIS[Redis Cluster\n3 nodes]
    end

    subgraph EU["Region: EU-West-1 (GDPR Tenants)"]
        EU_SVC[All Services Replicated\nEU data stays in EU]
        EU_DB[(EU PostgreSQL\nData residency enforced)]
        EU_KAFKA2[EU Kafka Cluster]
    end

    subgraph DR["Region: US-West-2 (DR / Warm Standby)"]
        DR_APP[Scaled-down cluster\nAll services]
        DR_DB[(PostgreSQL\nCross-region replica)]
    end

    DNS --> CDN --> WAF --> GW
    GW --> US_PLAT & US_SHARED & US_ENT
    US_SHARED & US_ENT --> US_KAFKA --> US_PG & US_REDIS
    US --> EU
    US --> DR
```

---

## Kubernetes Cluster Topology

```mermaid
graph TD
    subgraph CLUSTER["Kubernetes Cluster — Per Region"]

        subgraph NS_PLATFORM["Namespace: learntrack-platform"]
            D_AUTH[Deployment: auth-service\nreplicas: 3  HPA: 3–8]
            D_TMS[Deployment: tenant-mgmt-service\nreplicas: 2  HPA: 2–6]
            D_NOTIF[Deployment: notification-service\nreplicas: 2  HPA: 2–8]
            D_AUDIT[Deployment: audit-service\nreplicas: 2  HPA: 2–4]
        end

        subgraph NS_SHARED["Namespace: learntrack-shared (Starter + Pro)"]
            D_ING[Deployment: ingestion-service\nreplicas: 2  HPA: 2–10]
            D_PROF[Deployment: profile-service\nreplicas: 3  HPA: 3–10]
            D_RISK[Deployment: risk-engine\nreplicas: 2  HPA: 2–8]
            D_RULE[Deployment: rule-mgmt-service\nreplicas: 2  HPA: 2–4]
            D_INT[Deployment: intervention-service\nreplicas: 2  HPA: 2–6]
            D_RPT[Deployment: reporting-service\nreplicas: 2  HPA: 2–6]
        end

        subgraph NS_ENT_A["Namespace: tenant-acme-corp (Enterprise)"]
            E_ING[ingestion-service\nDedicated pods]
            E_PROF[profile-service\nDedicated pods]
            E_RISK[risk-engine\nDedicated pods]
            E_INT[intervention-service]
            E_RPT[reporting-service]
        end

        subgraph NS_DATA["Namespace: learntrack-data"]
            STS_PG[StatefulSet: postgresql\n1 primary + 2 replicas]
            STS_REDIS[StatefulSet: redis-cluster\n3 nodes]
            STS_ES[StatefulSet: elasticsearch\n3 nodes]
            STS_KAFKA[StatefulSet: kafka\n3 brokers + zookeeper]
        end

        subgraph NS_OBS["Namespace: learntrack-observability"]
            PROM[Prometheus]
            GRAF[Grafana\nPer-tenant dashboards]
            LOKI[Loki / ELK\nTenant-tagged logs]
            JAEGER[Jaeger\nDistributed tracing]
        end

        INGRESS[Ingress Controller\nNGINX / Traefik\nTLS + tenant routing]
    end

    INGRESS --> NS_PLATFORM & NS_SHARED & NS_ENT_A
    NS_SHARED & NS_ENT_A --> NS_DATA
    NS_PLATFORM & NS_SHARED & NS_ENT_A --> NS_OBS
```

---

## Resource Sizing Per Service

| Service | Replicas (min–max) | CPU Request | CPU Limit | RAM Request | RAM Limit |
|---|---|---|---|---|---|
| Auth Service | 3 – 8 | 250m | 1000m | 512 Mi | 2 Gi |
| Tenant Mgmt Service | 2 – 6 | 250m | 1000m | 512 Mi | 2 Gi |
| Ingestion Service | 2 – 10 | 500m | 2000m | 1 Gi | 4 Gi |
| Profile Service | 3 – 10 | 500m | 2000m | 1 Gi | 4 Gi |
| Risk Engine | 2 – 8 | 500m | 2000m | 1 Gi | 4 Gi |
| Rule Mgmt Service | 2 – 4 | 250m | 1000m | 512 Mi | 2 Gi |
| Intervention Service | 2 – 6 | 250m | 1000m | 512 Mi | 2 Gi |
| Reporting Service | 2 – 6 | 500m | 2000m | 1 Gi | 4 Gi |
| Notification Service | 2 – 8 | 100m | 500m | 256 Mi | 1 Gi |
| Audit Service | 2 – 4 | 250m | 500m | 512 Mi | 1 Gi |
| PostgreSQL Primary | Fixed: 1 | 2 | 8 | 8 Gi | 32 Gi |
| Redis Cluster Node | Fixed: 3 | 500m | 2000m | 2 Gi | 8 Gi |
| Kafka Broker | Fixed: 3 | 1 | 4 | 4 Gi | 16 Gi |
| Elasticsearch Node | Fixed: 3 | 1 | 4 | 4 Gi | 8 Gi |

---

## CI/CD Pipeline

```mermaid
flowchart LR
    subgraph Source["Source Control"]
        GIT[Git Monorepo\nor per-service repos]
    end

    subgraph CI["Continuous Integration — per service"]
        LINT[Lint + Static Analysis\nESLint · Checkstyle · SonarQube]
        UT[Unit Tests\nMin 80% coverage]
        IT[Integration Tests\nTestcontainers]
        SAST[Security Scan\nSnyk · Trivy]
        BUILD[Build + Push\nDocker Image → ECR/ACR]
        HELM[Package Helm Chart\nVersion tagged]
    end

    subgraph CD["Continuous Delivery — ArgoCD GitOps"]
        DEV[Deploy → dev\nAuto on merge to main]
        TEST[Deploy → test\nAuto — run smoke tests]
        STG[Deploy → staging\nAuto — perf + UAT tests]
        GATE{Manual\nApproval Gate\nRelease manager}
        PROD[Deploy → production\nRolling update per service]
    end

    subgraph POST["Post-Deploy"]
        SMOKE[Smoke Tests\nCritical API endpoints]
        MON[Monitor\n15 min observation window]
        ROLL[Auto-rollback\nif error rate spikes]
    end

    GIT -->|PR merge| LINT --> UT --> IT --> SAST --> BUILD --> HELM
    HELM --> DEV --> TEST --> STG --> GATE --> PROD --> SMOKE --> MON
    MON -->|Error rate > 1%| ROLL
```

### Pipeline Gate Criteria

| Gate | Criterion | Block On |
|---|---|---|
| Lint | Zero errors | Any error |
| Unit tests | ≥ 80 % coverage | Coverage drop |
| Integration tests | All green | Any failure |
| Security scan (SAST) | No CRITICAL CVEs | Critical CVE found |
| Docker image build | Successful | Build failure |
| Staging perf test | P95 < 200 ms | SLA breach |
| Manual approval | Release manager sign-off | Not approved |
| Smoke tests (prod) | All critical endpoints 200 OK | Any failure → auto-rollback |

---

## High Availability & Disaster Recovery

```mermaid
graph TB
    subgraph PRIMARY["Primary Region — Active"]
        AZ1[Availability Zone 1\nApp pods + DB Primary]
        AZ2[Availability Zone 2\nApp pods + DB Replica]
        AZ3[Availability Zone 3\nApp pods + DB Replica]
        AZ1 <-->|Synchronous replication| AZ2
        AZ2 <-->|Synchronous replication| AZ3
    end

    subgraph DR_REGION["DR Region — Warm Standby"]
        DR_APP2[Scaled-down app cluster\n10% capacity — scales up on failover]
        DR_PG[(PostgreSQL\nAsync cross-region streaming replica)]
        DR_REDIS2[(Redis replica)]
        DR_KAFKA2[Kafka MirrorMaker 2\nCross-region topic replication]
    end

    subgraph BACKUP["Backup Strategy"]
        WAL[Continuous WAL archiving\nto S3 — every 5 min]
        DAILY[Daily full backup\nretained 30 days]
        SNAP[Nightly volume snapshots\nper service DB]
        COLD[Cold archive\nper tenant on deprovision]
    end

    PRIMARY -->|Async streaming| DR_REGION
    PRIMARY --> BACKUP
```

| DR Metric | Starter / Pro | Enterprise |
|---|---|---|
| Recovery Time Objective (RTO) | < 4 hours | < 1 hour |
| Recovery Point Objective (RPO) | < 1 hour | < 15 minutes |
| Backup frequency | Daily full + WAL | Continuous WAL + hourly snapshot |
| DR test frequency | Quarterly | Monthly |
| SLA uptime guarantee | 99.5 % | 99.9 % |

---

## Monitoring & Observability (Per-Tenant)

```mermaid
graph LR
    subgraph Metrics["Metrics — Prometheus + Grafana"]
        M1[API latency P50/P95/P99\nper service per tenant]
        M2[Error rate per endpoint]
        M3[Risk engine processing time]
        M4[Kafka consumer lag per tenant]
        M5[DB connection pool per tenant]
        M6[Tenant plan usage meters]
    end

    subgraph Logs["Structured Logs — ELK / Loki"]
        L1[All logs tagged with tenant_id]
        L2[Audit logs — pgaudit + app layer]
        L3[Ingestion error logs]
        L4[Security and access logs]
    end

    subgraph Tracing["Distributed Tracing — Jaeger / X-Ray"]
        T1[Trace ID propagated across all services]
        T2[Per-tenant trace filtering]
        T3[P99 latency breakdown per hop]
    end

    subgraph Alerts["Alerts — PagerDuty / OpsGenie"]
        A1[🚨 API error rate > 1%]
        A2[🚨 P95 latency > 500 ms]
        A3[🚨 Kafka lag > 5 min any tenant]
        A4[🚨 DB replication lag > 60 s]
        A5[🚨 Tenant provisioning failure]
        A6[⚠️ Tenant plan usage > 90%]
        A7[⚠️ Disk usage > 80%]
        A8[💳 Payment failure — suspension imminent]
    end

    Metrics & Logs & Tracing --> Alerts
```

---

## Security Controls — SaaS Hardening

| Control | Implementation |
|---|---|
| Tenant data isolation | PostgreSQL Row Security (Starter) · Schema separation (Pro) · Dedicated DB (Enterprise) |
| Network isolation | Kubernetes NetworkPolicy — services cannot cross namespace boundaries |
| Secrets management | HashiCorp Vault — rotated per tenant, never in env vars |
| Inter-service auth | mTLS via Istio service mesh — all pod-to-pod traffic encrypted |
| API rate limiting | Per-tenant rate limits enforced at API Gateway (Kong) |
| Container security | Non-root containers, read-only root filesystem, no privileged pods |
| Image scanning | Trivy in CI — blocks on CRITICAL CVEs before any deploy |
| WAF | OWASP Core Rule Set — blocks SQLi, XSS, CSRF at edge |
| PII encryption | Column-level AES-256 for email, phone, date of birth |
| Audit logging | Immutable audit trail per tenant — `pgaudit` + app-layer events |
| Penetration testing | Quarterly external pentest + annual red-team exercise |
| Compliance | FERPA (US schools) · GDPR (EU tenants) · SOC 2 Type II (platform-wide) |
| Data residency | EU tenants provisioned in EU-West region — data never leaves EU |

---

## SaaS Go-Live Checklist

### Platform Readiness

| Item | Owner |
|---|---|
| All services deployed and health-checked in production | DevOps |
| Multi-region failover tested and documented | DevOps |
| WAF rules validated against OWASP test suite | Security |
| Kafka topic replication verified across regions | DevOps |
| Tenant provisioning automation tested end-to-end | Engineering |
| Billing integration (Stripe) tested with live keys | Finance / Engineering |
| Platform admin console operational | Engineering |
| Monitoring dashboards and all alerts active | DevOps |
| Penetration test completed and findings remediated | Security |
| SOC 2 controls documented and in place | Security / Compliance |

### First Tenant Onboarding Readiness

| Item | Owner |
|---|---|
| Onboarding email templates reviewed and tested | Marketing / Engineering |
| Default risk rule library validated (min 15 rules) | Product |
| Default report templates validated by compliance officer | Compliance |
| User documentation and help centre live | Product |
| In-app onboarding walkthrough tested | UX / Engineering |
| Support ticketing system configured per tenant | Support |
| SLA monitoring per tenant tier active | DevOps |

---

## 20-Week SaaS Build & Launch Roadmap

```mermaid
gantt
    title SaaS Multi-Tenant Build — 20 Weeks
    dateFormat  YYYY-MM-DD
    section Phase 1 — Foundation
    Tenant Management Service + Auth Service    :p1a, 2026-02-09, 14d
    API Gateway multi-tenant routing            :p1b, after p1a, 7d
    DB schema isolation models all 3 tiers      :p1c, after p1a, 14d

    section Phase 2 — Domain Services
    Ingestion + Profile services                :p2a, 2026-02-23, 14d
    Risk Engine + Rule Management services      :p2b, after p2a, 14d

    section Phase 3 — Workflows
    Intervention service + approval workflow    :p3a, 2026-03-23, 14d
    Notification + Audit services               :p3b, after p3a, 7d

    section Phase 4 — Reporting and UX
    Reporting service + compliance templates    :p4a, 2026-04-13, 14d
    Role-based dashboards all 5 roles           :p4b, after p4a, 14d

    section Phase 5 — SaaS Hardening
    Multi-tenant load and penetration testing   :p5a, 2026-05-11, 7d
    Billing integration and plan enforcement    :p5b, after p5a, 7d
    Tenant onboarding automation end-to-end     :p5c, after p5b, 3d
    Production deploy and hypercare week 1      :p5d, after p5c, 4d
```
