# System Architecture

# System Architecture — SaaS Multi-Tenant Microservices

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB[Web App\nReact / Angular]
        MOB[Mobile PWA]
        EXT[External Systems\nAttendance · Assessment APIs]
    end

    subgraph Edge["Edge Layer"]
        CDN[CDN\nCloudFront / Akamai\nStatic assets]
        WAF[WAF\nOWASP Core Rules]
        GW[API Gateway\nKong / AWS API GW\nTenant routing · Rate limiting · Auth]
    end

    subgraph Platform["Platform Services — Shared Across All Tenants"]
        AUTH[Auth / Identity Service\nOAuth2 · JWT · SAML · MFA]
        TMS[Tenant Management Service\nProvisioning · Config · Billing · Feature flags]
        NOTIF[Notification Service\nEmail · SMS · In-app — Stateless]
        AUDIT[Audit Service\nImmutable event log]
    end

    subgraph Domain["Domain Microservices — Tenant-Isolated"]
        ING[Ingestion Service\nAttendance · Assessments · Milestones]
        PROF[Learner Profile Service\nAggregation · Analytics · Trends]
        RISK[Risk Engine Service\nRule execution · Classification · Alerts]
        RULE[Rule Management Service\nRule CRUD · Versioning · Test sandbox]
        INT[Intervention Service\nWorkflow · Scheduling · Outcomes]
        RPT[Reporting Service\nCompliance · Dashboards · Exports]
    end

    subgraph Messaging["Event Bus"]
        KAFKA[Apache Kafka\nTenant-scoped topics]
    end

    subgraph Data["Data Layer — Per-Service Databases"]
        DB_AUTH[(auth-db)]
        DB_TMS[(tenant-db)]
        DB_ING[(ingestion-db)]
        DB_PROF[(profile-db)]
        DB_RISK[(risk-db)]
        DB_RULE[(rules-db)]
        DB_INT[(intervention-db)]
        DB_RPT[(reporting-db)]
        DB_AUDIT[(audit-db)]
        REDIS[(Redis Cluster\nTenant context · Profiles · Sessions)]
        ES[(Elasticsearch\nSearch · Analytics)]
        BLOB[Object Storage\nS3 / Blob\nReports · Imports · Archives]
    end

    WEB & MOB --> CDN --> WAF --> GW
    EXT --> GW
    GW --> AUTH
    GW --> TMS
    GW --> ING & PROF & RISK & RULE & INT & RPT

    AUTH --> DB_AUTH
    TMS --> DB_TMS
    TMS --> REDIS

    ING --> DB_ING
    ING -->|data.ingested| KAFKA
    KAFKA --> PROF
    PROF --> DB_PROF
    PROF --> REDIS
    PROF -->|profile.updated| KAFKA
    KAFKA --> RISK
    RISK --> DB_RISK
    RISK -->|risk.detected / risk.escalated / risk.resolved| KAFKA
    KAFKA --> INT & RPT & NOTIF & AUDIT
    INT --> DB_INT
    INT -->|intervention.*| KAFKA
    KAFKA --> RPT & NOTIF & AUDIT
    RPT --> DB_RPT
    RPT --> BLOB
    AUDIT --> DB_AUDIT
    RULE --> DB_RULE
    ES --> RPT & PROF
```

---

## Tenant Isolation Models

```mermaid
graph TB
    subgraph ENT["🥇 Enterprise Tier\nDedicated DB + Dedicated K8s Namespace"]
        E_NS[Dedicated Namespace\ntenant-acme-corp]
        E_DB[(Dedicated PostgreSQL\nFull isolation)]
        E_KAFKA[Dedicated Kafka topics]
    end

    subgraph PRO["🥈 Pro Tier\nShared Cluster + Dedicated DB Schema"]
        P_NS[Shared Namespace\nlearning-app-shared]
        P_DB[(Shared PostgreSQL\nSchema: tenant_springfield_hs\nSchema: tenant_riverdale_ac)]
        P_KAFKA[Shared Kafka topics\nPartitioned by tenant_id]
    end

    subgraph STR["🥉 Starter Tier\nShared Everything + Row-level tenant_id"]
        S_NS[Shared Namespace]
        S_DB[(Shared PostgreSQL\nShared schema\nAll tables have tenant_id column)]
        S_KAFKA[Shared Kafka topics\nFiltered by tenant_id]
    end

    GW[API Gateway\nResolves tenant tier\nRoutes accordingly] --> ENT & PRO & STR
```

| Isolation Aspect | Starter | Pro | Enterprise |
|---|---|---|---|
| Database | Shared — row-level `tenant_id` | Shared DB — separate schema | Dedicated DB instance |
| Kubernetes | Shared namespace | Shared namespace | Dedicated namespace |
| Kafka topics | Shared — filtered by `tenant_id` | Shared — partitioned by `tenant_id` | Dedicated topics |
| Redis keyspace | Prefixed by `tenant_id` | Prefixed by `tenant_id` | Dedicated Redis cluster |
| Data breach blast radius | Entire shared tier | Schema-level | Fully isolated |

---

## Service Responsibilities & Ownership

### Auth / Identity Service
```mermaid
graph LR
    subgraph AUTH_SVC["Auth / Identity Service"]
        LOGIN[Login\nUsername+pwd · SSO · MFA]
        TOKEN[JWT Issuance\naccess + refresh tokens]
        RBAC[RBAC Engine\nRole resolution per tenant]
        SSO[SSO / SAML\nPer-tenant IdP config]
        PROV[User Auto-provisioning\nfrom SSO attributes]
    end
    AUTH_SVC --> DB_AUTH[(auth-db)]
```

**Owns:** Users, roles, sessions, SSO configurations
**Does NOT own:** Tenant configuration (that's TMS), learner profiles (that's Profile Service)

---

### Tenant Management Service
```mermaid
graph LR
    subgraph TMS_SVC["Tenant Management Service"]
        ONB[Onboarding\n& Provisioning]
        CFG[Tenant Config\nBranding · Timezone · Locale]
        FLAGS[Feature Flags\nPer-tenant toggles]
        PLAN[Plan Management\nUpgrade · Downgrade]
        METER[Usage Metering\nLearners · API calls · Storage]
        BILL[Billing Integration\nStripe / Zuora]
    end
    TMS_SVC --> DB_TMS[(tenant-db)]
    TMS_SVC --> REDIS[(Redis\nContext cache TTL=60s)]
```

**Owns:** Tenant registry, plans, feature flags, branding, usage metrics
**Critical role:** Every domain service reads tenant context from this service (via Redis cache) on every request

---

### Ingestion Service
```mermaid
graph LR
    subgraph ING_SVC["Ingestion Service"]
        REST[REST API\nSync ingestion]
        BATCH[Batch Processor\nCSV · Excel import]
        VAL[Validator\nSchema · Completeness · Duplicates]
        NORM[Normaliser\nGrade scales · Date formats]
        PUB[Event Publisher\ndata.ingested]
    end
    ING_SVC --> DB_ING[(ingestion-db\nRaw validated records)]
    ING_SVC --> KAFKA
```

**Owns:** Raw attendance, assessment, and milestone records post-validation
**Key rule:** Never calls Profile Service directly — publishes events only

---

### Learner Profile Service
```mermaid
graph LR
    subgraph PROF_SVC["Learner Profile Service"]
        AGG[Profile Aggregator\nMulti-source join]
        CALC[Metric Calculator\nGPA · Attendance % · Trends]
        SNAP[Snapshot Manager\nHistorical snapshots]
        CACHE_MGR[Cache Manager\nRedis invalidation]
        API[Profile API\nv1 / v2]
    end
    PROF_SVC --> DB_PROF[(profile-db)]
    PROF_SVC --> REDIS[(Redis TTL=1hr)]
    PROF_SVC --> KAFKA
```

**Owns:** Aggregated learner profiles, performance metrics, trend history
**Key rule:** Never reads raw attendance/assessment data directly — consumes `data.ingested` events

---

### Risk Engine Service
```mermaid
graph LR
    subgraph RISK_SVC["Risk Engine Service"]
        LOAD[Rule Loader\nfrom rules-db via API]
        EXEC[Rule Executor\nAND · OR · NOT operators]
        SCORE[Risk Scorer\nWeighted composite]
        CLASS[Classifier\nCritical · High · Medium · Low]
        ALERT[Alert Generator]
        REC[Intervention Recommender]
    end
    RISK_SVC --> DB_RISK[(risk-db\nrisk_assessments)]
    RISK_SVC --> KAFKA
```

**Owns:** Risk assessment records, risk scoring logic
**Key rule:** Reads rule definitions from Rule Management Service API (not directly from rules-db)

---

### Rule Management Service
```mermaid
graph LR
    subgraph RULE_SVC["Rule Management Service"]
        CRUD[Rule CRUD API]
        VER[Versioning Engine]
        VAL2[Rule Validator\nSchema + logic check]
        SAND[Test Sandbox\nRun against sample profiles]
        AUDIT_R[Rule Audit Trail]
    end
    RULE_SVC --> DB_RULE[(rules-db\nrisk_rules + versions)]
```

**Owns:** Rule definitions, rule versions, rule audit trail
**Separated from Risk Engine** so rules can be edited, tested, and versioned without touching execution logic

---

### Intervention Service
```mermaid
stateDiagram-v2
    [*] --> Recommended : risk.detected consumed
    Recommended --> Pending_Approval : Teacher submits
    Pending_Approval --> Active : Counsellor approves
    Pending_Approval --> Rejected : Admin rejects
    Active --> Completed : All sessions done
    Active --> Cancelled : Admin cancels
    Completed --> Evaluated : Outcomes recorded
    Evaluated --> [*]
```

**Owns:** Interventions, sessions, outcomes
**Publishes:** `intervention.assigned`, `intervention.approved`, `intervention.completed`

---

### Reporting Service
```mermaid
graph LR
    subgraph RPT_SVC["Reporting Service"]
        TEMPL[Template Library\nPer-tenant + standard]
        AGG2[Data Aggregator\nCross-service data via events]
        GEN[Report Generator\nPDF · Excel · CSV]
        SCHED[Scheduler\nCron-based auto-reports]
        DIST[Distributor\nEmail · Portal · API]
    end
    RPT_SVC --> DB_RPT[(reporting-db\nAggregates + snapshots)]
    RPT_SVC --> BLOB[(Object Storage\nGenerated reports)]
```

**Owns:** Report templates, generated report metadata, reporting aggregates
**Key design:** Builds its own read-optimised aggregates from consumed events — never joins across other services' databases

---

## Cross-Cutting Concerns

### Tenant Context Resolution (Every Request)
```mermaid
sequenceDiagram
    participant SVC as Any Domain Service
    participant REDIS as Redis
    participant TMS as Tenant Management Service

    SVC->>REDIS: GET tenant_ctx:{tenant_id}
    alt Cache HIT (TTL=60s)
        REDIS-->>SVC: {db_schema, feature_flags, plan_limits}
    else Cache MISS
        SVC->>TMS: GET /tenants/{tenant_id}/context
        TMS-->>SVC: Tenant context JSON
        SVC->>REDIS: SET tenant_ctx:{tenant_id} TTL=60s
    end
    SVC->>SVC: Apply db_schema to all queries
    SVC->>SVC: Enforce feature_flags + plan_limits
```

### Security Architecture

| Layer | Control |
|---|---|
| Edge | WAF (OWASP rules), DDoS protection, TLS 1.3 |
| API Gateway | JWT validation, tenant resolution, rate limiting per tenant |
| Service-to-service | mTLS via Istio / Linkerd service mesh |
| Database | Schema-level or row-level isolation, pgaudit logging |
| Data at rest | AES-256 encryption, column-level encryption for PII |
| Secrets | HashiCorp Vault — no secrets in env vars or code |
| Compliance | FERPA (schools), GDPR (EU tenants), SOC 2 Type II |
