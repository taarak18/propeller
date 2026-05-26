# Deployment Architecture

# Deployment Architecture — Corporate L&D SaaS Multi-Tenant

## Global Infrastructure Overview

```mermaid
graph TB
    subgraph Global["Global — Shared Platform Layer"]
        DNS[Route 53 / Azure DNS\nGlobal DNS + Health routing]
        CDN[CloudFront / Akamai\nStatic assets · Frontend SPA]
        WAF[WAF\nOWASP Core Rules + DDoS protection]
        GW[API Gateway\nKong / AWS API GW\nOrg tenant routing · Rate limiting · Auth]
    end

    subgraph US["Region: US-East-1 (Primary)"]
        subgraph US_PLAT["Platform Services Namespace"]
            US_AUTH[Auth Service\nCorporate SSO · JWT · MFA]
            US_TMS[Tenant Management Service\nOrg onboarding · Billing]
            US_NOTIF[Notification Service\nEmail · SMS · In-app]
            US_AUDIT[Audit Service\nCompliance audit log]
        end
        subgraph US_SHARED["Shared App Namespace — Starter + Pro Orgs"]
            US_ING[Ingestion Service\nLMS · Assessment · Milestone APIs]
            US_PROF[Employee Profile Service]
            US_RISK[Risk Engine Service]
            US_INT[Intervention Service\nRemedial Training · Coaching]
            US_RPT[Reporting Service\nCompliance · L&D dashboards]
            US_RULE[Rule Management Service\nCompetency rules]
        end
        subgraph US_ENT["Enterprise Org Namespaces (Dedicated)"]
            ENT_A[tenant-acme-corp\nDedicated pods + DB]
            ENT_B[tenant-regulated-co\nDedicated pods + DB]
        end
        US_KAFKA[Kafka Cluster\n3 brokers]
        US_PG[PostgreSQL\nPrimary + 2 Replicas]
        US_REDIS[Redis Cluster\n3 nodes]
    end

    subgraph EU["Region: EU-West-1 (GDPR Tenants)"]
        EU_SVC[All Services Replicated\nEU employee data stays in EU]
        EU_DB[(EU PostgreSQL\nData residency enforced)]
    end

    subgraph DR["Region: US-West-2 (DR / Warm Standby)"]
        DR_APP[Scaled-down cluster]
        DR_DB[(PostgreSQL cross-region replica)]
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

        subgraph NS_SHARED["Namespace: learntrack-shared (Starter + Pro Orgs)"]
            D_ING[Deployment: ingestion-service\nLMS · Assessment · Milestone\nreplicas: 2  HPA: 2–10]
            D_PROF[Deployment: employee-profile-service\nreplicas: 3  HPA: 3–10]
            D_RISK[Deployment: risk-engine-service\nreplicas: 2  HPA: 2–8]
            D_RULE[Deployment: rule-mgmt-service\nCompetency rules\nreplicas: 2  HPA: 2–4]
            D_INT[Deployment: intervention-service\nRemedial training · Coaching\nreplicas: 2  HPA: 2–6]
            D_RPT[Deployment: reporting-service\nCompliance reports\nreplicas: 2  HPA: 2–6]
        end

        subgraph NS_ENT["Namespace: tenant-acme-corp (Enterprise)"]
            E_ING[ingestion-service\nDedicated pods]
            E_PROF[employee-profile-service\nDedicated pods]
            E_RISK[risk-engine-service\nDedicated pods]
            E_INT[intervention-service\nDedicated pods]
            E_RPT[reporting-service\nDedicated pods]
        end

        subgraph NS_DATA["Namespace: learntrack-data"]
            STS_PG[StatefulSet: postgresql\n1 primary + 2 replicas]
            STS_REDIS[StatefulSet: redis-cluster\n3 nodes]
            STS_ES[StatefulSet: elasticsearch\n3 nodes]
            STS_KAFKA[StatefulSet: kafka\n3 brokers]
        end

        subgraph NS_OBS["Namespace: learntrack-observability"]
            PROM[Prometheus]
            GRAF[Grafana\nPer-org L&D dashboards]
            LOKI[Loki / ELK\nOrg-tagged structured logs]
            JAEGER[Jaeger\nDistributed tracing]
        end

        INGRESS[Ingress Controller\nNGINX / Traefik · TLS · Org routing]
    end

    INGRESS --> NS_PLATFORM & NS_SHARED & NS_ENT
    NS_SHARED & NS_ENT --> NS_DATA
    NS_PLATFORM & NS_SHARED & NS_ENT --> NS_OBS
```

---

## Resource Sizing Per Service

| Service | Replicas (min–max) | CPU Request | CPU Limit | RAM Request | RAM Limit |
|---|---|---|---|---|---|
| Auth Service | 3 – 8 | 250m | 1000m | 512 Mi | 2 Gi |
| Tenant Mgmt Service | 2 – 6 | 250m | 1000m | 512 Mi | 2 Gi |
| Ingestion Service | 2 – 10 | 500m | 2000m | 1 Gi | 4 Gi |
| Employee Profile Service | 3 – 10 | 500m | 2000m | 1 Gi | 4 Gi |
| Risk Engine Service | 2 – 8 | 500m | 2000m | 1 Gi | 4 Gi |
| Rule Management Service | 2 – 4 | 250m | 1000m | 512 Mi | 2 Gi |
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
        GIT[Git Repository\nper-service or monorepo]
    end

    subgraph CI["Continuous Integration — per service"]
        LINT[Lint + Static Analysis\nSonarQube · Checkstyle]
        UT[Unit Tests\nMin 80% coverage]
        IT[Integration Tests\nTestcontainers]
        SAST[Security Scan\nSnyk · Trivy]
        BUILD[Build + Push Docker Image\nECR / ACR]
        HELM[Package Helm Chart\nVersion tagged]
    end

    subgraph CD["Continuous Delivery — ArgoCD GitOps"]
        DEV[Deploy → dev\nAuto on merge to main]
        TEST[Deploy → test\nSmoke + regression]
        STG[Deploy → staging\nPerf + UAT]
        GATE{Manual Approval\nRelease Manager}
        PROD[Deploy → production\nRolling update per service]
    end

    subgraph POST["Post-Deploy"]
        SMOKE[Smoke Tests\nCritical L&D API endpoints]
        MON[Monitor\n15 min observation window]
        ROLL[Auto-rollback\nif error rate spikes]
    end

    GIT -->|PR merge| LINT --> UT --> IT --> SAST --> BUILD --> HELM
    HELM --> DEV --> TEST --> STG --> GATE --> PROD --> SMOKE --> MON
    MON -->|Error rate > 1%| ROLL
```

---

## High Availability & Disaster Recovery

```mermaid
graph TB
    subgraph PRIMARY["Primary Region — Active (3 AZs)"]
        AZ1[AZ 1 — App pods + DB Primary]
        AZ2[AZ 2 — App pods + DB Replica]
        AZ3[AZ 3 — App pods + DB Replica]
        AZ1 <-->|Sync replication| AZ2
        AZ2 <-->|Sync replication| AZ3
    end

    subgraph DR_REGION["DR Region — Warm Standby"]
        DR_APP2[Scaled-down app cluster\nScales up on failover]
        DR_PG[(PostgreSQL async replica)]
        DR_KAFKA2[Kafka MirrorMaker 2\nCross-region topic replication]
    end

    subgraph BACKUP["Backup Strategy"]
        WAL[Continuous WAL archiving\nto S3 every 5 min]
        DAILY[Daily full backup\n30-day retention]
        SNAP[Nightly volume snapshots]
        COLD[Cold archive per org\non deprovision]
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

## Monitoring & Observability

```mermaid
graph LR
    subgraph Metrics["Metrics — Prometheus + Grafana"]
        M1[API latency P50/P95/P99 per service per org]
        M2[Error rate per endpoint]
        M3[Risk engine processing time per org]
        M4[Kafka consumer lag — training data pipeline]
        M5[DB connection pool per org]
        M6[Org plan usage meters]
    end

    subgraph Logs["Structured Logs — ELK / Loki"]
        L1[All logs tagged with tenant_id]
        L2[Compliance audit logs — pgaudit + app layer]
        L3[LMS ingestion error logs]
        L4[Security and access logs]
    end

    subgraph Alerts["Alerts — PagerDuty / OpsGenie"]
        A1[🚨 API error rate > 1%]
        A2[🚨 P95 latency > 500 ms]
        A3[🚨 Training data pipeline lag > 5 min]
        A4[🚨 DB replication lag > 60 s]
        A5[🚨 Org provisioning failure]
        A6[⚠️ Org plan usage > 90%]
        A7[💳 Payment failure — suspension imminent]
    end

    Metrics & Logs --> Alerts
```

---

## Security Controls

| Control | Implementation |
|---|---|
| Org data isolation | PostgreSQL Row Security (Starter) · Schema separation (Pro) · Dedicated DB (Enterprise) |
| Network isolation | Kubernetes NetworkPolicy — services cannot cross namespace boundaries |
| Secrets management | HashiCorp Vault — rotated per org, never in env vars |
| Inter-service auth | mTLS via Istio service mesh |
| API rate limiting | Per-org rate limits at Kong API Gateway |
| Container security | Non-root containers, read-only root filesystem |
| Image scanning | Trivy in CI — blocks on CRITICAL CVEs |
| WAF | OWASP Core Rule Set — blocks SQLi, XSS, CSRF |
| Employee PII encryption | AES-256 column-level for email, phone, date of birth |
| Compliance audit trail | Immutable per-org audit log — pgaudit + app-layer events |
| Penetration testing | Quarterly external pentest + annual red-team |
| Regulatory compliance | GDPR (EU orgs) · SOC 2 Type II · HR data privacy per jurisdiction |
| Data residency | EU-based orgs provisioned in EU-West — data never leaves EU |

---

## SaaS Go-Live Checklist

### Platform Readiness

| Item | Owner |
|---|---|
| All 10 services deployed and health-checked in production | DevOps |
| Multi-region failover tested end-to-end | DevOps |
| WAF rules validated against OWASP test suite | Security |
| Org provisioning automation tested (< 5 min target) | Engineering |
| Billing integration (Stripe) tested with live keys | Finance / Engineering |
| Platform admin console operational | Engineering |
| Monitoring dashboards and all alerts active | DevOps |
| Penetration test completed and findings remediated | Security |
| SOC 2 Type II controls documented | Security / Compliance |

### First Corporate Customer Onboarding Readiness

| Item | Owner |
|---|---|
| Default competency risk rule library ready (min 15 rules) | L&D Product |
| Default compliance report templates validated | Compliance Officer |
| LMS / assessment system API connectors tested | Engineering |
| User documentation and help centre live | Product |
| In-app L&D onboarding walkthrough tested | UX / Engineering |
| Support ticketing system configured per org tier | Support |

---

## 20-Week SaaS Build & Launch Roadmap

```mermaid
gantt
    title Corporate L&D SaaS — 20-Week Build Plan
    dateFormat  YYYY-MM-DD
    section Phase 1 — Foundation
    Tenant Mgmt Service + Auth Service          :p1a, 2026-02-09, 14d
    API Gateway multi-org routing               :p1b, after p1a, 7d
    DB isolation models all 3 tiers             :p1c, after p1a, 14d

    section Phase 2 — Core L&D Services
    Ingestion Service LMS + Assessment + Milestone APIs :p2a, 2026-02-23, 14d
    Employee Profile Service + Risk Engine      :p2b, after p2a, 14d

    section Phase 3 — Intervention Workflows
    Intervention Service remedial training and coaching :p3a, 2026-03-23, 14d
    Notification + Audit Services               :p3b, after p3a, 7d

    section Phase 4 — Reporting & Dashboards
    Compliance Reporting Service                :p4a, 2026-04-13, 14d
    Role-based L&D dashboards all 4 roles       :p4b, after p4a, 14d

    section Phase 5 — SaaS Hardening & Launch
    Multi-org load and penetration testing      :p5a, 2026-05-11, 7d
    Billing integration and plan enforcement    :p5b, after p5a, 7d
    Org onboarding automation end-to-end        :p5c, after p5b, 3d
    Production deploy and hypercare week 1      :p5d, after p5c, 4d
```
