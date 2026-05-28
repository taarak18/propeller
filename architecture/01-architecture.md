# System Architecture

## Corporate L&D SaaS — Multi-Tenant Microservices (Production-Ready v2.0)

> **Changes from v1.0:** Fixed data ownership boundary (Ingestion = raw staging only; Profile = curated read model). Added transactional outbox + Debezium CDC. Added DLQ / retry topics. Added Consent Service. Added BFF layer. Added WebSocket/SSE gateway. Gateway-local JWT validation via JWKS. Istio service mesh with explicit circuit breaker / retry / timeout policy. Temporal workflow engine for sagas. See [`L-D/ARCHITECTURE_REVIEW.md`](../L-D/ARCHITECTURE_REVIEW.md) for gap analysis.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB[Web App\nReact 18 + TypeScript + Vite]
        MOB[Mobile PWA\nReact 18 Progressive Web App]
        EXT[External Systems\nLMS - Assessment APIs - HRIS]
    end

    subgraph Edge["Edge Layer"]
        CDN[CloudFront\nStatic assets + SPA]
        WAF[AWS WAF\nOWASP Core Rules + DDoS]
        GW[Kong API Gateway\nTenant routing - Rate limiting\nJWKS-local JWT validation]
    end

    subgraph BFF["BFF Layer"]
        BFF_WEB[Web BFF\nAggregates APIs for dashboard views]
        BFF_MOB[Mobile BFF\nThin API for PWA - reduced payload]
    end

    subgraph Platform["Platform Services — Shared Across All Tenants"]
        AUTH[Auth Service\nOAuth2 - JWT - SAML - MFA\nPublishes JWKS endpoint]
        TMS[Tenant Management Service\nOrg onboarding - Config - Billing\nTemporal client]
        TEMPORAL[Temporal Server\nSaga orchestration]
        NOTIF[Notification Service\nEmail - SMS - In-app\nWebSocket - SSE — Stateless]
        AUDIT[Audit Service\nHash-chained immutable log\nS3 Object Lock archive]
        CONSENT[Consent Service\nPer-employee consent - Opt-out\nErasure orchestration]
        UNLEASH[Unleash Feature Flag Server\nRelease-time + tenant-level flags]
    end

    subgraph Domain["Domain Microservices — Tenant-Isolated"]
        ING[Ingestion Service\nRaw staging only\nIdempotent ingest endpoints]
        PROF[Employee Profile Service\nCurated read model from data.ingested events\nCompetency analytics - Trends]
        RISK[Risk Engine Service\nRule execution - At-risk classification\nHuman-review gate for automated profiling]
        RULE[Rule Management Service\nRule CRUD - Versioning - Test sandbox]
        INT[Intervention Service\nTemporal workflow client\nRemedial training - Coaching outcomes]
        RPT[Reporting Service\nCDC-fed read model\nCompliance reports - Exports]
    end

    subgraph Messaging["Event Bus — Apache Kafka / AWS MSK"]
        KAFKA[Kafka Cluster\nTenant-scoped topics\nProtobuf + Confluent Schema Registry]
        DLQ[Dead Letter Queue Topics\nOne per consumer group]
        OBX[Outbox tables per service\nDebezium CDC producer]
    end

    subgraph Data["Data Layer — Per-Service Databases"]
        DB_AUTH[(auth-db)]
        DB_TMS[(tenant-db)]
        DB_ING[(ingestion-db\nRaw staging only)]
        DB_PROF[(profile-db\nCurated learning data)]
        DB_RISK[(risk-db)]
        DB_RULE[(rules-db)]
        DB_INT[(intervention-db)]
        DB_RPT[(reporting-db\nCDC read model)]
        DB_AUDIT[(audit-db)]
        DB_CONSENT[(consent-db)]
        REDIS[(Redis Cluster\nTenant context - Profiles - Sessions\nElastiCache / self-hosted)]
        BLOB[AWS S3\nObject Lock enabled\nReports - Imports - Archives - Evidence]
    end

    subgraph Observability["Observability — OpenTelemetry"]
        OTEL[OTel Collector]
        PROM[Prometheus + Grafana\nMetrics per service per tenant]
        TEMPO[Grafana Tempo\nDistributed traces]
        LOKI[Grafana Loki\nTenant-tagged structured logs]
        SENTRY[Sentry\nError tracking + performance]
    end

    WEB & MOB --> CDN --> WAF --> GW
    EXT --> GW
    GW --> BFF_WEB & BFF_MOB
    GW --> AUTH
    GW --> TMS
    GW --> ING & RISK & RULE & INT & RPT & CONSENT
    BFF_WEB & BFF_MOB --> PROF & RISK & INT & RPT

    AUTH --> DB_AUTH
    AUTH -.->|JWKS public keys| GW

    TMS --> DB_TMS
    TMS --> REDIS
    TMS --> TEMPORAL

    ING --> DB_ING
    ING --> OBX
    OBX -->|Debezium CDC| KAFKA
    KAFKA --> PROF
    PROF --> DB_PROF
    PROF --> REDIS
    PROF --> OBX
    KAFKA --> RISK
    RISK --> DB_RISK
    RISK --> OBX
    KAFKA --> INT & RPT & NOTIF & AUDIT & CONSENT
    INT --> DB_INT
    INT --> OBX
    RPT --> DB_RPT
    RPT --> BLOB
    AUDIT --> DB_AUDIT
    AUDIT --> BLOB
    CONSENT --> DB_CONSENT
    CONSENT --> TEMPORAL
    RULE --> DB_RULE
    KAFKA --> DLQ
    TEMPORAL --> TMS & INT & CONSENT

    ING & PROF & RISK & INT & RPT & AUTH & TMS & NOTIF & AUDIT & CONSENT --> OTEL
    OTEL --> PROM & TEMPO & LOKI & SENTRY
```

---

## Data Ownership Boundary (Corrected)

> **Critical fix from v1.0:** The original documents placed `training_attendance`, `assessment_records`, and `competency_milestones` in both `ingestion-db` and `profile-db`. The correct boundary is:

```mermaid
flowchart LR
    subgraph SourceSystems[Source Systems]
        LMS[LMS - REST - xAPI - SCORM]
        HRIS[HRIS - Workday - SuccessFactors]
        ASMT[Assessment platforms]
        UPLOAD[CSV - SFTP file uploads]
    end

    subgraph IngestionDb[ingestion-db OWNS]
        STAGE[raw_training_attendance_staging\nraw_assessment_staging\nraw_milestone_staging\ningestion_jobs\ningestion_errors]
    end

    subgraph ProfileDb[profile-db OWNS curated read model]
        CURATED[training_attendance\nassessment_records\ncompetency_milestones\nemployee_milestone_progress\nprofile_snapshots]
    end

    SourceSystems -->|idempotent POST APIs| IngestionDb
    IngestionDb -->|outbox + data.ingested event| ProfileDb
    ProfileDb -.->|outbox + profile.updated event| RiskEngine[Risk Engine]
```

**Rule:** Ingestion Service owns raw + staging. Employee Profile Service owns curated learning data and builds it exclusively from `data.ingested` Kafka events. Neither service reads from the other's database.

---

## Tenant Isolation Models

```mermaid
graph TB
    subgraph ENT["Enterprise Tier\nDedicated DB + Dedicated K8s Namespace"]
        E_NS[Dedicated Namespace\ntenant-acme-corp]
        E_DB[(Dedicated PostgreSQL\nFull isolation)]
        E_REDIS[Dedicated Redis Cluster]
        E_KAFKA[Dedicated Kafka topics]
    end

    subgraph PRO["Pro Tier\nShared Cluster + Dedicated DB Schema"]
        P_NS[Shared Namespace\nlearntrack-shared]
        P_DB[(Shared PostgreSQL\nSchema: tenant_acme_corp\nSchema: tenant_globex_ltd)]
        P_KAFKA[Shared Kafka topics\nPartitioned by tenant_id]
    end

    subgraph STR["Starter Tier\nShared Everything + Row-level tenant_id"]
        S_NS[Shared Namespace]
        S_DB[(Shared PostgreSQL\nShared schema - RLS policies)]
        S_KAFKA[Shared Kafka topics\nFiltered by tenant_id]
    end

    GW[Kong API Gateway\nResolves tenant tier\nRoutes accordingly] --> ENT & PRO & STR
```

| Isolation Aspect | Starter | Pro | Enterprise |
|---|---|---|---|
| Database | Shared — PostgreSQL RLS | Shared DB — dedicated schema | Dedicated DB instance |
| Kubernetes | Shared namespace | Shared namespace | Dedicated namespace |
| Kafka topics | Shared — filtered by `tenant_id` | Shared — partitioned by `tenant_id` | Dedicated topics |
| Redis keyspace | Prefixed by `tenant_id` | Prefixed by `tenant_id` | Dedicated Redis cluster |
| KMS / encryption | Shared DEK per tenant via Vault transit | Dedicated DEK per tenant | Dedicated DEK + KMS key alias |
| Data breach blast radius | Shared tier (RLS boundary) | Schema-level | Fully isolated |

---

## Service Responsibilities & Ownership

### Auth / Identity Service
**Owns:** Users, roles, sessions, SSO configurations per organisation
**Key capability (v2):** Publishes JWKS endpoint — API Gateway validates JWTs locally using cached public keys. Auth Service is no longer on the hot path of every request; only called for refresh and revocation checks.

---

### Tenant Management Service
**Owns:** Organisation registry, subscription plans, feature flags, branding, usage metering
**v2 change:** Acts as Temporal workflow client — tenant provisioning and plan upgrades run as Temporal sagas with full compensation on failure. Domain services read tenant context from Redis cache (60 s TTL).

---

### Ingestion Service
**Owns:** Raw validated staging records only (`ingestion-db`)
**Data accepted:**
- Employee training attendance records (REST API — JSON batches)
- Periodic assessment scores (REST API)
- Competency-level learning milestones (REST API)
- CSV / SFTP file upload (converted to same staging schema)

**Key rules:**
- All endpoints require `Idempotency-Key` header — duplicate submissions are detected via `ingestion_jobs.idempotency_key` index and return `200 Already Processed`
- Never calls Employee Profile Service directly — publishes `data.ingested` event via outbox only
- Validates schema, completeness, duplicates before staging

---

### Employee Profile Service
**Owns:** Curated learning profiles in `profile-db` — built exclusively from `data.ingested` events
**v2 change:** No longer referenced by `ingestion-db`. Consumes events, builds its own aggregated view.

**Calculated metrics per employee:**
- Training attendance percentage (rolling 30-day, current period, all-time)
- Assessment average per competency / training module
- Score trend direction (improving / stable / declining)
- Competency milestone completion rate
- Days since last milestone progress

---

### Risk Engine Service
**Owns:** Risk assessment records, risk scoring
**v2 addition:** Human-review gate — before `CRITICAL` risk notifications are sent, a human-review record is created in `risk-db`. A Trainer or L&D Manager must acknowledge or override the automated classification. This satisfies GDPR Article 22, CCPA/CPRA, and DPDP Act automated-profiling obligations.

| Rule Type | Example |
|---|---|
| Attendance-based | Training attendance < 75% in last 30 days |
| Score-based | Two consecutive failing assessments |
| Trend-based | 20% score decline over 60 days |
| Milestone-based | Required competency milestone overdue > 14 days |
| Composite | Low attendance AND low assessment scores |
| Compliance deadline | Incomplete mandatory training within 7 days of deadline |

---

### Rule Management Service
**Owns:** Competency risk rule definitions, versions, test runs
Separated from Risk Engine — L&D Administrators edit, test, and version rules without touching execution.

**Sample rule definition (Protobuf-serialised, JSON representation):**
```json
{
  "ruleId": "COMP_001",
  "ruleName": "Composite High-Risk Competency Factors",
  "severity": "CRITICAL",
  "priority": 5,
  "version": "1.0",
  "effectiveFrom": "2026-01-01",
  "conditions": {
    "operator": "AND",
    "criteria": [
      { "metric": "training_attendance_percentage", "period": "30_days", "operator": "less_than", "value": 80 },
      { "metric": "competency_average_score", "period": "30_days", "operator": "less_than", "value": 60 }
    ]
  },
  "actions": {
    "setRiskLevel": "CRITICAL",
    "alert": ["trainer", "ld_manager", "line_manager"],
    "intervention": ["remedial_training", "coaching_assignment"],
    "requireHumanReview": true
  },
  "applicableTo": { "departments": "all", "competencies": "all" }
}
```

---

### Intervention Service
**Owns:** Interventions, training sessions, coaching assignments, outcomes
**v2 change:** Core workflow (assign → approve → session-log → complete → evaluate) now runs as a **Temporal workflow** — durable, resumable, observable. Intervention Service holds domain state; Temporal handles process orchestration.

Intervention state machine:
```mermaid
stateDiagram-v2
    [*] --> Recommended : risk.detected consumed
    Recommended --> PendingApproval : Trainer submits
    PendingApproval --> Active : L&D Manager approves
    PendingApproval --> Rejected : L&D Manager rejects
    Active --> Completed : All sessions done
    Active --> Cancelled : L&D Admin cancels
    Completed --> Evaluated : Outcomes recorded
    Evaluated --> [*]
    Active --> Escalated : SLA breach - Temporal timer fires
    Escalated --> Active : Manager acknowledges
```

---

### Reporting Service
**Owns:** Compliance report templates, generated report metadata, L&D reporting aggregates
**v2 change:** `reporting-db` is now a **CDC-fed CQRS read model** — Debezium captures changes from `profile-db`, `risk-db`, `intervention-db` → Kafka CDC topics → Reporting consumer builds denormalised aggregates. No dual-write or manual sync.

Reports available:
- Employee competency progress reports
- At-risk employee watchlist (with rules triggered and human-review status)
- Intervention effectiveness summary (remedial training vs coaching)
- Training attendance compliance reports
- Competency achievement reports by department / role
- Regulatory certification readiness reports
- Executive L&D performance summary

---

### Consent Service (new in v2)
**Owns:** Per-employee consent records, opt-out flags, consent change history
**Purpose:** Satisfies GDPR, DPDP Act 2023, CCPA, and PIPEDA requirements for documented consent and opt-out from automated risk profiling.
**Key APIs:**
- `POST /consents` — record employee consent for a specific purpose (analytics, risk profiling, benchmarking)
- `DELETE /consents/{employee_id}/purpose/{purpose}` — opt-out; triggers downstream suppression
- `GET /consents/{employee_id}` — consent audit trail
- Integrates with Erasure Saga — on employee erasure request, consent records are exported then purged

---

### Audit Service
**Owns:** Immutable compliance audit log
**v2 changes:**
- Each audit entry is **hash-chained**: `entry.hash = SHA-256(entry.payload + previous_entry.hash)`
- Periodic batch export to **AWS S3 with Object Lock (WORM)** — prevents post-hoc tampering
- Supports tamper-evidence verification API: `GET /audit/verify/{tenant_id}?from={date}&to={date}`

---

## Reliable Event Delivery (Outbox + DLQ)

```mermaid
sequenceDiagram
    participant SVC as Domain Service
    participant DB as Service DB
    participant OBX as Outbox Table
    participant DBZ as Debezium CDC
    participant K as Kafka topic
    participant CON as Consumer
    participant RT as retry.{topic}
    participant DLQ as dlq.{topic}
    participant ALERT as PagerDuty

    SVC->>DB: BEGIN TRANSACTION
    SVC->>DB: Write domain entity row
    SVC->>OBX: INSERT outbox event row
    SVC->>DB: COMMIT
    DBZ->>OBX: Poll committed rows
    DBZ->>K: Publish event (exactly-once)
    K->>CON: Deliver
    alt Success
        CON->>DB: Idempotent upsert
    else Transient failure
        CON->>RT: Republish with backoff header
        RT->>CON: Redeliver after delay
    else Poison message
        CON->>DLQ: Park after 3 attempts
        DLQ->>ALERT: Depth > 0 triggers alert within 5 min
    end
```

DLQ naming convention: `dlq.{service}.{event-type}` — e.g. `dlq.profile.data-ingested`

---

## Cross-Cutting Concerns

### API Gateway — JWKS-local JWT Validation

```mermaid
sequenceDiagram
    participant GW as Kong API Gateway
    participant REDIS as JWKS Cache (Redis)
    participant AUTH as Auth Service

    Note over GW: On request arrival
    GW->>GW: Extract Bearer JWT
    GW->>REDIS: GET jwks:{tenant_id} (TTL = 5 min)
    alt Cache HIT
        REDIS-->>GW: JWKS public keys
    else Cache MISS
        GW->>AUTH: GET /auth/v1/.well-known/jwks.json
        AUTH-->>GW: JWKS
        GW->>REDIS: SET jwks:{tenant_id} TTL=5min
    end
    GW->>GW: Verify JWT signature locally
    GW->>GW: Check exp, iat, tenant_id claim
    GW-->>SVC: Forward + X-Tenant-ID + X-User-ID + X-Roles headers
```

Auth Service is only called on key rotation or on first cache miss. It is **not on the hot path** of every request.

---

### Tenant Context Resolution

```mermaid
sequenceDiagram
    participant SVC as Any Domain Service
    participant REDIS as Redis
    participant TMS as Tenant Management Service

    SVC->>REDIS: GET tenant_ctx:{tenant_id}
    alt Cache HIT (TTL=60s)
        REDIS-->>SVC: db_schema, feature_flags, plan_limits, data_region
    else Cache MISS
        SVC->>TMS: GET /tenants/{tenant_id}/context
        TMS-->>SVC: Tenant context JSON
        SVC->>REDIS: SET tenant_ctx:{tenant_id} TTL=60s
    end
    SVC->>SVC: Apply db_schema to all DB queries
    SVC->>SVC: Enforce feature_flags via Unleash SDK
    SVC->>SVC: Enforce plan_limits
    SVC->>SVC: Tag all logs/traces with tenant_id
```

---

### Security Architecture

| Layer | Control |
|---|---|
| Edge | AWS WAF (OWASP Core Rules + managed IP reputation), AWS Shield Standard, CloudFront, TLS 1.3 |
| API Gateway | JWKS-local JWT validation, tenant resolution, per-tenant rate limiting (Kong rate-limit plugin) |
| Service-to-service | Istio mTLS (mutual TLS); circuit breaker and retry via DestinationRule / VirtualService |
| Database | Schema-level or row-level isolation (PostgreSQL RLS), pgaudit extension for SQL audit |
| Data at rest | AES-256; PII columns use envelope encryption (Vault transit DEK + AWS KMS CMK) |
| Secrets | HashiCorp Vault — per-tenant namespace; no secrets in env vars or Kubernetes ConfigMaps |
| Compliance | GDPR · UK GDPR · CCPA · PIPEDA / Law 25 · DPDP Act 2023 · SOC 2 Type II |
| Accessibility | WCAG 2.1 AA · European Accessibility Act (EAA) |

---

### Istio Service Mesh — Defaults

All services are enrolled in Istio service mesh. Baseline policies applied via `DestinationRule` and `VirtualService`:

| Policy | Default Setting |
|---|---|
| mTLS | `STRICT` on all service-to-service |
| Circuit breaker | 5 consecutive errors → open; 30 s half-open probe |
| Retry | 3 attempts; retryOn: `5xx,reset,connect-failure`; per-try timeout 2 s |
| Timeout | 10 s global; report generation endpoint: 60 s |
| Egress | Allow only to registered external services (SMTP, Stripe, Temporal, Vault) |

---

### Role Permissions Matrix

| Feature | Trainer | L&D Administrator | L&D Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| View own employees' profiles | Yes | Yes | Yes | Yes (own only) |
| View all employee profiles | Yes | Yes | Yes | No |
| Define / edit competency risk rules | No | Yes | No | No |
| Assign remedial training / coaching | Yes | Yes | Yes | No |
| Approve interventions | No | Yes | Yes | No |
| Acknowledge automated risk assessment (GDPR Art.22 gate) | Yes | Yes | Yes | No |
| Generate compliance reports | No | Yes | No | No |
| View L&D dashboards | Yes | Yes | Yes | Yes (limited) |
| Manage users / roles | No | Yes | No | No |
| Manage consent records | No | Yes | No | Yes (own only) |
| Request own data erasure | No | No | No | Yes |
| Configure tenant settings | No | Yes | No | No |
