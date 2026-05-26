# 02 · Architecture Diagrams — Industry-Standard Visual Reference

> All diagrams use **Mermaid** and render natively on GitHub, GitLab, VS Code, and most markdown viewers.

> **A note on naming in diagrams.** Diagrams show the **technology** at each role (e.g., "PostgreSQL", "Apache Kafka", "MinIO"). When deployed to a public cloud, stateful technologies like PostgreSQL, Redis, Kafka, and object storage typically bind to the cloud provider's managed equivalent at deployment time — see [`13-Multi-Cloud-Mapping.md`](./13-Multi-Cloud-Mapping.md). MinIO, Keycloak, and Centrifugo are shown as the **reference self-hosted implementations**; each has commercial / managed alternatives documented in [`14-Technology-Choice-Reference.md`](./14-Technology-Choice-Reference.md).

---

## Diagram Index

1. [Full System Architecture (C4 Container Level)](#1-full-system-architecture-c4-container-level)
2. [Network Topology & Zero-Trust Layers](#2-network-topology--zero-trust-layers)
3. [Request Flow — End to End](#3-request-flow--end-to-end)
4. [Data Plane Architecture](#4-data-plane-architecture)
5. [Event-Driven Pipeline (Kafka)](#5-event-driven-pipeline-kafka)
6. [Nightly Risk Batch Workflow (UC-08)](#6-nightly-risk-batch-workflow-uc-08)
7. [Async Report Generation (UC-11)](#7-async-report-generation-uc-11)
8. [Multi-Region Deployment Topology](#8-multi-region-deployment-topology)
9. [GitOps CI/CD Pipeline](#9-gitops-cicd-pipeline)
10. [Observability Stack](#10-observability-stack)
11. [Identity & SSO Federation (UC-04)](#11-identity--sso-federation-uc-04)
12. [Service Mesh Traffic Management](#12-service-mesh-traffic-management)

---

## 1. Full System Architecture (C4 Container Level)

```mermaid
flowchart TB
    subgraph EXT["External Actors"]
        U1["L&D Admin"]
        U2["Trainer"]
        U3["Manager"]
        U4["Employee"]
        U5["External LMS"]
        U6["Payment Provider<br/>Stripe / Chargebee"]
    end

    subgraph EDGE["Edge & CDN"]
        CDN["CDN<br/>Cloudflare / Fastly"]
        WAF["WAF<br/>OWASP CRS"]
        DNS["DNS<br/>Cloudflare / Route53 / Cloud DNS"]
    end

    subgraph CLUSTER["Kubernetes Cluster"]
        subgraph INGRESS_NS["ingress namespace"]
            ING["NGINX / Envoy Ingress"]
            CERTMGR["cert-manager"]
        end

        subgraph GATEWAY_NS["gateway namespace"]
            KONG["Kong Gateway<br/>(or Envoy Gateway)"]
        end

        subgraph APP_NS["app namespace"]
            FRONTEND["frontend<br/>nginx + React SPA"]
            TS["tenant-svc"]
            IS["identity-svc"]
            IG["ingestion-svc"]
            PS["profile-svc"]
            RS["rules-svc"]
            IV["intervention-svc"]
            RP["report-svc<br/>(Knative)"]
            DS["dashboard-api"]
            NS["notification-worker"]
            AS["audit-worker"]
            BS["billing-svc"]
            WS["websocket-svc<br/>Centrifugo"]
        end

        subgraph BATCH_NS["batch namespace"]
            ARGO["Argo Workflows"]
            KNATIVE["Knative Eventing"]
            KEDA["KEDA Autoscaler"]
        end

        subgraph DATA_NS["data namespace"]
            PG[("PostgreSQL<br/>CloudNativePG")]
            PG_R[("PG Read Replica")]
            RD[("Redis<br/>Sentinel")]
            MINIO[("MinIO Cluster")]
            MONGO[("MongoDB ReplicaSet")]
            KAFKA[("Kafka<br/>Strimzi")]
        end

        subgraph SEC_NS["security namespace"]
            KC["Keycloak"]
            VAULT["Vault"]
            OPA["OPA Gatekeeper"]
        end

        subgraph OBS_NS["observability namespace"]
            PROM["Prometheus"]
            GRAF["Grafana"]
            LOKI["Loki"]
            TEMPO["Tempo"]
            OTEL["OpenTelemetry<br/>Collector"]
        end
    end

    subgraph EXT_SVC["External Services"]
        SMTP["SMTP Relay<br/>SendGrid / SES"]
        SMS["SMS Gateway<br/>Twilio"]
    end

    U1 & U2 & U3 & U4 --> DNS --> CDN --> WAF --> ING
    U5 --> CDN
    ING --> KONG
    CERTMGR -.-> ING
    KONG --> FRONTEND
    KONG --> TS & IS & IG & PS & RS & IV & RP & DS & BS
    NS --> SMTP
    NS --> SMS
    BS --> U6
    APP_NS --> KAFKA
    KAFKA --> ARGO & KNATIVE
    APP_NS --> PG
    APP_NS --> PG_R
    APP_NS --> RD
    RP --> MINIO
    AS --> MONGO
    IS --> KC
    VAULT -.-> APP_NS
    OPA -.-> APP_NS
    APP_NS --> OTEL
    OTEL --> PROM & LOKI & TEMPO
    PROM & LOKI & TEMPO --> GRAF
    WS -.->|"WebSocket"| U1 & U2 & U3 & U4

    classDef ext fill:#f1f5f9,color:#1e293b,stroke:#64748b
    classDef edge fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef gw fill:#fce7f3,color:#831843,stroke:#ec4899
    classDef app fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef batch fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef data fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef sec fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef obs fill:#dcfce7,color:#14532d,stroke:#16a34a

    class U1,U2,U3,U4,U5,U6,SMTP,SMS ext
    class CDN,WAF,DNS edge
    class ING,CERTMGR,KONG gw
    class FRONTEND,TS,IS,IG,PS,RS,IV,RP,DS,NS,AS,BS,WS app
    class ARGO,KNATIVE,KEDA batch
    class PG,PG_R,RD,MINIO,MONGO,KAFKA data
    class KC,VAULT,OPA sec
    class PROM,GRAF,LOKI,TEMPO,OTEL obs
```

---

## 2. Network Topology & Zero-Trust Layers

```mermaid
flowchart TB
    INTERNET(["Internet"])

    subgraph PERIMETER["Perimeter Defense"]
        DDOS["DDoS Protection<br/>(CDN provider native)"]
        WAF["L7 WAF<br/>ModSecurity + OWASP CRS"]
    end

    subgraph CLUSTER_NET["Kubernetes Cluster Network"]
        direction TB
        LB["LoadBalancer Service<br/>(NLB / GCLB / cloud-LB)"]

        subgraph DMZ["DMZ — ingress namespace"]
            INGRESS["NGINX Ingress<br/>TLS termination"]
            KONGGW["Kong Gateway<br/>JWT validation"]
        end

        subgraph APP_TIER["Application Tier — app namespace"]
            APP["12 Microservices<br/>NetworkPolicy: deny-all-ingress<br/>except from gateway namespace"]
        end

        subgraph BATCH_TIER["Batch Tier — batch namespace"]
            BATCH["Argo Workflows<br/>Knative<br/>NetworkPolicy: no external egress"]
        end

        subgraph DATA_TIER["Data Tier — data namespace"]
            DATA["PostgreSQL, Redis, MinIO,<br/>MongoDB, Kafka<br/>NetworkPolicy: only from app + batch"]
        end

        subgraph SEC_TIER["Security Tier — security namespace"]
            SEC["Keycloak, Vault, OPA<br/>NetworkPolicy: explicit allow only"]
        end

        MESH["Service Mesh (Istio / Linkerd)<br/>mTLS everywhere · AuthorizationPolicy"]
    end

    INTERNET --> DDOS --> WAF --> LB
    LB --> INGRESS --> KONGGW
    KONGGW -- "mTLS" --> APP_TIER
    APP_TIER -- "mTLS" --> DATA_TIER
    APP_TIER -- "mTLS" --> BATCH_TIER
    APP_TIER -- "mTLS" --> SEC_TIER
    BATCH_TIER -- "mTLS" --> DATA_TIER
    MESH -.-> APP_TIER & BATCH_TIER & DATA_TIER & SEC_TIER

    classDef internet fill:#1e293b,color:#94a3b8,stroke:#475569
    classDef perim fill:#fee2e2,color:#7f1d1d,stroke:#dc2626,stroke-width:3px
    classDef dmz fill:#fef3c7,color:#92400e,stroke:#f59e0b,stroke-width:2px
    classDef app fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef data fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef sec fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef mesh fill:#dcfce7,color:#14532d,stroke:#16a34a,stroke-dasharray: 5 5

    class INTERNET internet
    class DDOS,WAF perim
    class LB,INGRESS,KONGGW dmz
    class APP app
    class DATA,BATCH data
    class SEC sec
    class MESH mesh
```

### Key Zero-Trust Principles

| Principle | Implementation |
|---|---|
| **Default deny** | Kubernetes `NetworkPolicy` with `policyTypes: [Ingress, Egress]` deny-all baseline |
| **Identity per workload** | Each pod gets a SPIFFE/SPIRE identity (or service account + Istio cert) |
| **mTLS everywhere** | Istio `PeerAuthentication: STRICT` cluster-wide |
| **AuthZ at every hop** | OPA Gatekeeper + Istio `AuthorizationPolicy` |
| **Secrets never in env vars** | Vault Agent Injector or External Secrets Operator |

---

## 3. Request Flow — End to End

A typical API call from browser to database, showing every hop:

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant CDN as CDN (Cloudflare)
    participant WAF as WAF
    participant LB as LoadBalancer
    participant ING as NGINX Ingress
    participant KONG as Kong Gateway
    participant KC as Keycloak (OIDC)
    participant SVC as profile-svc Pod
    participant PG as PostgreSQL
    participant RD as Redis

    U->>CDN: GET /api/v1/employees/123/profile
    CDN->>WAF: Forward (cache miss)
    WAF->>WAF: Check OWASP rules
    WAF->>LB: Pass (clean)
    LB->>ING: HTTPS (TLS 1.3)
    ING->>ING: Cert from cert-manager
    ING->>KONG: HTTP (internal)
    KONG->>KC: Verify JWT signature (cached JWKS)
    KC-->>KONG: Valid (tenant_id, roles)
    KONG->>KONG: Rate-limit check (Redis-backed)
    KONG->>KONG: Inject X-Tenant-Id header
    KONG->>SVC: Forward request (mTLS via Istio)
    SVC->>RD: GET profile:{tenant}:{emp_id}
    alt Cache Hit
        RD-->>SVC: Cached JSON
    else Cache Miss
        SVC->>PG: SET LOCAL app.tenant_id; SELECT...
        PG-->>SVC: Result (RLS-filtered)
        SVC->>RD: SET cache (TTL 15min)
    end
    SVC-->>KONG: 200 OK
    KONG-->>ING: 200 OK
    ING-->>LB: 200 OK
    LB-->>WAF: 200 OK
    WAF-->>CDN: 200 OK + cache headers
    CDN-->>U: 200 OK (cached at edge if appropriate)
```

---

## 4. Data Plane Architecture

```mermaid
flowchart LR
    subgraph APP["Application Services"]
        SVC1["profile-svc"]
        SVC2["dashboard-api"]
        SVC3["report-svc"]
        SVC4["audit-worker"]
        SVC5["ingestion-svc"]
    end

    subgraph CACHE["Cache Tier"]
        REDIS_M["Redis Master"]
        REDIS_S1["Redis Replica 1"]
        REDIS_S2["Redis Replica 2"]
        SENTINEL["Sentinel Quorum"]
        REDIS_M -.-> REDIS_S1
        REDIS_M -.-> REDIS_S2
        SENTINEL -.-> REDIS_M
    end

    subgraph RDBMS["Relational Tier — PostgreSQL"]
        PGBOUNCER["PgBouncer<br/>Connection Pool"]
        PG_PRIMARY[("PG Primary<br/>HA Zone A")]
        PG_STANDBY[("PG Sync Standby<br/>HA Zone B")]
        PG_READ[("PG Read Replica<br/>Reporting")]
        PG_PRIMARY -.->|"streaming<br/>sync"| PG_STANDBY
        PG_PRIMARY -.->|"streaming<br/>async"| PG_READ
    end

    subgraph OBJECT["Object Storage"]
        MINIO_GW["MinIO Gateway"]
        MINIO_1["MinIO Node 1"]
        MINIO_2["MinIO Node 2"]
        MINIO_3["MinIO Node 3"]
        MINIO_4["MinIO Node 4"]
        MINIO_GW --> MINIO_1 & MINIO_2 & MINIO_3 & MINIO_4
    end

    subgraph DOC["Document Store"]
        MONGO_PRIMARY[("MongoDB Primary")]
        MONGO_S1[("MongoDB Secondary 1")]
        MONGO_S2[("MongoDB Secondary 2")]
        MONGO_PRIMARY -.-> MONGO_S1
        MONGO_PRIMARY -.-> MONGO_S2
    end

    subgraph STREAM["Event Streaming"]
        ZK["Zookeeper / KRaft"]
        K1["Kafka Broker 1"]
        K2["Kafka Broker 2"]
        K3["Kafka Broker 3"]
        K1 & K2 & K3 -.-> ZK
    end

    SVC1 --> REDIS_M
    SVC2 --> REDIS_M
    SVC1 --> PGBOUNCER
    SVC2 --> PGBOUNCER
    SVC3 --> PGBOUNCER
    SVC5 --> PGBOUNCER
    PGBOUNCER --> PG_PRIMARY
    PGBOUNCER -.->|"read-only<br/>queries"| PG_READ
    SVC3 --> MINIO_GW
    SVC4 --> MONGO_PRIMARY
    SVC5 --> K1

    classDef app fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef cache fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef rdbms fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef obj fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef doc fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef stream fill:#fce7f3,color:#831843,stroke:#ec4899

    class SVC1,SVC2,SVC3,SVC4,SVC5 app
    class REDIS_M,REDIS_S1,REDIS_S2,SENTINEL cache
    class PGBOUNCER,PG_PRIMARY,PG_STANDBY,PG_READ rdbms
    class MINIO_GW,MINIO_1,MINIO_2,MINIO_3,MINIO_4 obj
    class MONGO_PRIMARY,MONGO_S1,MONGO_S2 doc
    class ZK,K1,K2,K3 stream
```

---

## 5. Event-Driven Pipeline (Kafka)

```mermaid
flowchart LR
    subgraph PRODUCERS["Event Producers"]
        IG["ingestion-svc"]
        TS["tenant-svc"]
        IV["intervention-svc"]
        BS["billing-svc"]
    end

    subgraph TOPICS["Kafka Topics<br/>(partition key: tenant_id)"]
        T1["training.attendance.v1<br/>50 partitions"]
        T2["training.assessment.v1<br/>20 partitions"]
        T3["training.milestone.v1<br/>20 partitions"]
        T4["tenant.lifecycle.v1<br/>10 partitions"]
        T5["intervention.events.v1<br/>20 partitions"]
        T6["billing.events.v1<br/>10 partitions"]
        T7["risk.alerts.v1<br/>30 partitions"]
        T8["notifications.outbound.v1<br/>30 partitions"]
    end

    subgraph CONSUMERS["Consumer Groups"]
        PS["profile-svc<br/>(aggregator)"]
        RE["risk-engine<br/>(rule evaluator)"]
        NS["notification-worker"]
        AS["audit-worker"]
        AN["analytics-svc"]
    end

    subgraph SINKS["Sinks"]
        PG[("PostgreSQL")]
        MONGO[("MongoDB Audit")]
        CH[("ClickHouse<br/>Analytics")]
    end

    IG --> T1 & T2 & T3
    TS --> T4
    IV --> T5
    BS --> T6
    T1 & T2 & T3 --> PS
    PS --> PG
    PS --> T7
    T7 --> RE --> T8
    T8 --> NS
    T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 --> AS --> MONGO
    T1 & T2 & T3 --> AN --> CH

    classDef prod fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef topic fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef cons fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef sink fill:#e0f2fe,color:#075985,stroke:#0284c7

    class IG,TS,IV,BS prod
    class T1,T2,T3,T4,T5,T6,T7,T8 topic
    class PS,RE,NS,AS,AN cons
    class PG,MONGO,CH sink
```

### Topic Naming Convention

`{domain}.{entity}.{version}` — versioned topics enable schema evolution without breaking consumers.

---

## 6. Nightly Risk Batch Workflow (UC-08)

```mermaid
flowchart TD
    CRON["CronWorkflow<br/>(Argo Workflows)<br/>Fires at 01:00 UTC"]
    FETCH["Fetch Active Tenants<br/>SELECT id FROM tenants<br/>WHERE status='ACTIVE'"]
    FANOUT["Fanout: 1 workflow<br/>per tenant<br/>(parallelism: 50)"]

    subgraph PER_TENANT["Per-Tenant Workflow"]
        T1["Step 1: Load active risk rules"]
        T2["Step 2: Load employee profiles<br/>(paginated 1000 at a time)"]
        T3["Step 3: Evaluate rules<br/>(Knative-scaled workers)"]
        T4["Step 4: Compute composite<br/>risk score per employee"]
        T5["Step 5: UPSERT risk_assessments"]
        T6["Step 6: Publish alerts<br/>to risk.alerts.v1 topic"]
        T1 --> T2 --> T3 --> T4 --> T5 --> T6
    end

    subgraph DOWNSTREAM["Downstream Consumers"]
        D1["notification-worker<br/>Email/SMS to Trainer + Admin"]
        D2["dashboard-api<br/>Cache invalidation"]
        D3["audit-worker<br/>Log to MongoDB"]
    end

    REPORT["Final: Report job summary<br/>per tenant + global metrics"]
    SLACK["Slack/Teams notification<br/>to ops channel"]

    CRON --> FETCH --> FANOUT --> PER_TENANT
    T6 -.-> D1 & D2 & D3
    PER_TENANT --> REPORT --> SLACK

    classDef trigger fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef wf fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef step fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef sink fill:#dcfce7,color:#14532d,stroke:#16a34a

    class CRON trigger
    class FETCH,FANOUT,REPORT wf
    class T1,T2,T3,T4,T5,T6 step
    class D1,D2,D3,SLACK sink
```

### Argo Workflow Manifest (Excerpt)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: CronWorkflow
metadata:
  name: nightly-risk-evaluation
spec:
  schedule: "0 1 * * *"
  timezone: "UTC"
  workflowSpec:
    entrypoint: evaluate-all-tenants
    parallelism: 50
    templates:
      - name: evaluate-all-tenants
        steps:
          - - name: fetch-tenants
              template: fetch-active-tenants
          - - name: per-tenant
              template: evaluate-tenant
              arguments:
                parameters: [{ name: tenant-id, value: "{{item}}" }]
              withParam: "{{steps.fetch-tenants.outputs.result}}"
```

---

## 7. Async Report Generation (UC-11)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant K as Kong Gateway
    participant API as report-svc API
    participant PG as PostgreSQL
    participant KAFKA as Kafka<br/>(report.jobs topic)
    participant KN as Knative<br/>report-worker
    participant MINIO as MinIO
    participant WS as Centrifugo<br/>WebSocket

    U->>K: POST /api/v1/reports {type:PDF, period:Q3}
    K->>API: Forward (JWT validated)
    API->>PG: INSERT report_jobs (status=PENDING)
    API->>KAFKA: Produce job event {job_id, tenant_id, params}
    API-->>U: 202 Accepted {job_id, status_url}

    Note over KN: KEDA scales report-worker<br/>from 0→N based on queue depth

    KAFKA->>KN: Consume job
    KN->>PG: SET app.tenant_id; SELECT data (RLS applied)
    KN->>KN: Render PDF (wkhtmltopdf / chromium-headless)
    KN->>MINIO: PUT reports/{tenant_id}/{job_id}.pdf
    KN->>MINIO: Generate pre-signed URL (24h)
    KN->>PG: UPDATE report_jobs SET status=COMPLETED, url=?
    KN->>WS: Publish to channel user:{user_id}
    WS-->>U: "Your report is ready: [Download]"

    U->>API: GET /api/v1/reports/{job_id}
    API->>PG: SELECT * FROM report_jobs WHERE id=?
    API-->>U: 200 {url, expires_at}
    U->>MINIO: GET (pre-signed URL)
    MINIO-->>U: PDF binary
```

---

## 8. Multi-Region Deployment Topology

```mermaid
flowchart TB
    subgraph GLOBAL["Global Layer"]
        GDNS["Global DNS<br/>(GeoDNS — Cloudflare /<br/>Route53 Latency / Cloud DNS)"]
        GCDN["Global CDN<br/>(Anycast PoPs worldwide)"]
    end

    subgraph PRIMARY["Region: US-East (Primary — India + AMER tenants)"]
        K8S_US["Kubernetes Cluster<br/>3 AZ, 3 control plane nodes"]
        PG_US[("PostgreSQL<br/>Primary + Sync Standby<br/>+ Async Read Replica")]
        MINIO_US[("MinIO erasure-coded<br/>4+2 across AZs")]
        KAFKA_US[("Kafka 3 brokers<br/>1 per AZ")]
    end

    subgraph EU["Region: EU-West (GDPR — EU tenants)"]
        K8S_EU["Kubernetes Cluster<br/>3 AZ"]
        PG_EU[("PostgreSQL<br/>Primary + Standby<br/>(EU data residency)")]
        MINIO_EU[("MinIO<br/>(EU data residency)")]
        KAFKA_EU[("Kafka 3 brokers")]
    end

    subgraph DR["Region: US-Central (Warm DR)"]
        K8S_DR["Kubernetes Cluster<br/>(scaled to 0 normally)"]
        PG_DR[("PostgreSQL<br/>Async Read Replica<br/>RPO 1hr · RTO 4hr")]
        MINIO_DR[("MinIO<br/>Geo-replicated bucket")]
    end

    subgraph GITOPS["Global GitOps"]
        REPO["Git Repository<br/>(GitHub / GitLab)"]
        ARGOCD["ArgoCD<br/>(multi-cluster sync)"]
        ARGOCD --> K8S_US & K8S_EU & K8S_DR
    end

    GDNS --> GCDN
    GCDN -- "India + AMER" --> K8S_US
    GCDN -- "EU traffic" --> K8S_EU
    GCDN -. "failover<br/>(US-East down)" .-> K8S_DR
    PG_US -. "WAL streaming" .-> PG_DR
    MINIO_US -. "geo-replication" .-> MINIO_DR
    REPO --> ARGOCD

    classDef global fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef prod fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef eu fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef dr fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef gitops fill:#f3e8ff,color:#581c87,stroke:#9333ea

    class GDNS,GCDN global
    class K8S_US,PG_US,MINIO_US,KAFKA_US prod
    class K8S_EU,PG_EU,MINIO_EU,KAFKA_EU eu
    class K8S_DR,PG_DR,MINIO_DR dr
    class REPO,ARGOCD gitops
```

---

## 9. GitOps CI/CD Pipeline

```mermaid
flowchart LR
    DEV["Developer<br/>git push feature/x"]

    subgraph CI["CI Pipeline (Tekton / GitHub Actions)"]
        LINT["Lint + Format"]
        TEST["Unit Tests<br/>>80% coverage"]
        SAST["SAST<br/>SonarQube + Semgrep"]
        BUILD["Docker Build<br/>(multi-arch)"]
        SCAN["Trivy Image Scan"]
        SIGN["Cosign Sign Image"]
        PUSH["Push to Harbor"]
    end

    HARBOR["Harbor Registry<br/>+ Notary signing"]

    subgraph CD["CD Pipeline (ArgoCD GitOps)"]
        MR["Auto-update<br/>image tag in Git<br/>via Renovate / Bot"]
        SYNC["ArgoCD detects change<br/>kubectl apply"]
        DEV_ENV["Dev Cluster<br/>Auto-sync"]
        STG_ENV["Staging Cluster<br/>Auto-sync + smoke tests"]
        PROD_ENV["Prod Cluster<br/>Manual approval gate"]
    end

    subgraph PROGRESS["Progressive Delivery"]
        ARGOROLL["Argo Rollouts<br/>Canary 10% → 50% → 100%"]
        ANALYSIS["Flagger / Prometheus<br/>analysis (P95, error rate)"]
        ROLLBACK["Auto-rollback if<br/>SLO violated"]
    end

    DEV --> LINT --> TEST --> SAST --> BUILD --> SCAN --> SIGN --> PUSH
    PUSH --> HARBOR --> MR --> SYNC
    SYNC --> DEV_ENV
    SYNC --> STG_ENV
    SYNC --> PROD_ENV --> ARGOROLL --> ANALYSIS
    ANALYSIS -- "healthy" --> ARGOROLL
    ANALYSIS -- "violated" --> ROLLBACK

    classDef dev fill:#f1f5f9,color:#1e293b,stroke:#64748b
    classDef ci fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef cd fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef reg fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef prog fill:#f3e8ff,color:#581c87,stroke:#9333ea

    class DEV dev
    class LINT,TEST,SAST,BUILD,SCAN,SIGN,PUSH ci
    class MR,SYNC,DEV_ENV,STG_ENV,PROD_ENV cd
    class HARBOR reg
    class ARGOROLL,ANALYSIS,ROLLBACK prog
```

---

## 10. Observability Stack

```mermaid
flowchart TB
    subgraph WORKLOADS["Workloads"]
        APP1["App Pod 1"]
        APP2["App Pod 2"]
        APP3["App Pod 3"]
    end

    subgraph COLLECT["Collection Layer"]
        OTELC["OpenTelemetry<br/>Collector DaemonSet"]
        FB["Fluent Bit<br/>DaemonSet"]
        PEX["Prometheus Exporters<br/>node-exporter, kube-state-metrics"]
    end

    subgraph STORE["Storage Layer"]
        PROM["Prometheus<br/>(short-term metrics)"]
        THANOS["Thanos<br/>(long-term metric storage<br/>in MinIO/S3)"]
        LOKI["Loki<br/>(logs in MinIO/S3)"]
        TEMPO["Tempo<br/>(traces in MinIO/S3)"]
    end

    subgraph VIZ["Visualization & Alerting"]
        GRAF["Grafana<br/>(unified UI)"]
        AM["Alertmanager"]
    end

    subgraph NOTIFY["Notification Channels"]
        SLACK["Slack / Teams"]
        PD["PagerDuty / OpsGenie"]
        EMAIL["Email"]
        WEBHOOK["Custom Webhooks"]
    end

    APP1 & APP2 & APP3 -.->|"metrics<br/>(OTLP)"| OTELC
    APP1 & APP2 & APP3 -.->|"traces<br/>(OTLP)"| OTELC
    APP1 & APP2 & APP3 -.->|"stdout/stderr"| FB
    PEX -.-> PROM
    OTELC --> PROM
    OTELC --> TEMPO
    FB --> LOKI
    PROM --> THANOS
    PROM --> GRAF
    THANOS --> GRAF
    LOKI --> GRAF
    TEMPO --> GRAF
    PROM --> AM
    AM --> SLACK & PD & EMAIL & WEBHOOK

    classDef wl fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef col fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef st fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef viz fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef notify fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class APP1,APP2,APP3 wl
    class OTELC,FB,PEX col
    class PROM,THANOS,LOKI,TEMPO st
    class GRAF,AM viz
    class SLACK,PD,EMAIL,WEBHOOK notify
```

---

## 11. Identity & SSO Federation (UC-04)

```mermaid
sequenceDiagram
    autonumber
    participant U as Tenant User
    participant B as Browser
    participant APP as React SPA
    participant KC as Keycloak<br/>(platform realm)
    participant IDP as Tenant IdP<br/>(Okta / AAD / OneLogin)
    participant API as Backend API

    U->>B: Visit https://tenant.platform.com
    B->>APP: Load SPA
    APP->>KC: OIDC Authorization Request<br/>(scope: openid profile, kc_idp_hint=tenant-saml)
    KC->>KC: Lookup tenant IdP config
    KC->>IDP: SAML AuthnRequest (signed)
    IDP->>U: Show login page
    U->>IDP: Enter corp credentials + MFA
    IDP-->>KC: SAML Response (signed assertion)
    KC->>KC: Validate signature; map claims<br/>(email → username, groups → roles)
    KC->>KC: Inject tenant_id custom claim
    KC-->>APP: OIDC Authorization Code
    APP->>KC: Exchange code for tokens
    KC-->>APP: access_token + refresh_token<br/>(JWT with tenant_id, roles)
    APP->>API: GET /api/v1/profile<br/>Authorization: Bearer {jwt}
    API->>API: Verify JWT (cached JWKS)
    API->>API: Extract tenant_id, set RLS context
    API-->>APP: 200 Profile JSON
```

---

## 12. Service Mesh Traffic Management

```mermaid
flowchart LR
    subgraph EXTERNAL["External Traffic"]
        EXT["Internet Client"]
    end

    subgraph MESH["Istio Service Mesh"]
        subgraph EDGE["Edge"]
            IGW["Istio IngressGateway"]
        end

        subgraph SVC_PROFILE["profile-svc"]
            P_V1["v1 (stable)<br/>weight: 90%"]
            P_V2["v2 (canary)<br/>weight: 10%"]
        end

        subgraph SVC_DASH["dashboard-api"]
            D_V1["v1"]
        end

        subgraph POLICY["Istio Policies"]
            VS["VirtualService<br/>traffic split"]
            DR["DestinationRule<br/>subsets v1, v2"]
            AP["AuthorizationPolicy<br/>JWT required"]
            PA["PeerAuthentication<br/>mTLS STRICT"]
        end
    end

    EXT --> IGW
    IGW -- "/api/v1/employees/*" --> VS
    VS --> P_V1 & P_V2
    IGW -- "/api/v1/dashboards/*" --> D_V1
    P_V1 -- "mTLS" --> D_V1
    DR -.-> P_V1 & P_V2
    AP -.-> SVC_PROFILE & SVC_DASH
    PA -.-> SVC_PROFILE & SVC_DASH

    classDef ext fill:#1e293b,color:#94a3b8,stroke:#475569
    classDef ig fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef sv fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef pol fill:#fee2e2,color:#7f1d1d,stroke:#dc2626,stroke-dasharray: 5 5

    class EXT ext
    class IGW ig
    class P_V1,P_V2,D_V1 sv
    class VS,DR,AP,PA pol
```

---

## How These Diagrams Render

- **GitHub / GitLab / Bitbucket** — Native rendering in markdown viewer.
- **VS Code** — Install "Markdown Preview Mermaid Support" extension.
- **Confluence / Notion** — Use Mermaid plugin or paste source into a mermaid block.
- **Standalone export** — Use [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli):
  ```bash
  npx -p @mermaid-js/mermaid-cli mmdc -i 02-Architecture-Diagrams.md -o diagrams.pdf
  ```
