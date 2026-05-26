# System Architecture

# System Architecture — Corporate L&D SaaS Multi-Tenant Microservices

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB[Web App\nReact / Angular]
        MOB[Mobile PWA]
        EXT[External Systems\nLMS · Assessment APIs · Trainer Notes]
    end

    subgraph Edge["Edge Layer"]
        CDN[CDN\nCloudFront / Akamai\nStatic assets]
        WAF[WAF\nOWASP Core Rules]
        GW[API Gateway\nKong / AWS API GW\nTenant routing · Rate limiting · Auth]
    end

    subgraph Platform["Platform Services — Shared Across All Tenants"]
        AUTH[Auth / Identity Service\nOAuth2 · JWT · SAML · MFA]
        TMS[Tenant Management Service\nOrg onboarding · Config · Billing · Feature flags]
        NOTIF[Notification Service\nEmail · SMS · In-app — Stateless]
        AUDIT[Audit Service\nImmutable compliance audit log]
    end

    subgraph Domain["Domain Microservices — Tenant-Isolated"]
        ING[Ingestion Service\nTraining attendance · Assessment scores · Competency milestones]
        PROF[Employee Profile Service\nLearning profile aggregation · Competency analytics · Trends]
        RISK[Risk Engine Service\nRule execution · At-risk classification · Alerts]
        RULE[Rule Management Service\nCompetency rule CRUD · Versioning · Test sandbox]
        INT[Intervention Service\nRemedial training · Coaching & mentoring · Outcomes]
        RPT[Reporting Service\nCompliance reports · L&D dashboards · Exports]
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
        BLOB[Object Storage\nS3 / Blob\nCompliance reports · Training imports · Archives]
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
        P_NS[Shared Namespace\nlearntrack-shared]
        P_DB[(Shared PostgreSQL\nSchema: tenant_acme_corp\nSchema: tenant_globex_ltd)]
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
**Owns:** Users, roles, sessions, SSO configurations per organisation
**Key capability:** Supports per-tenant corporate SSO (SAML 2.0 / OIDC) enabling employees to log in with their existing corporate credentials (Azure AD, Okta, etc.)

---

### Tenant Management Service
**Owns:** Organisation registry, subscription plans, feature flags, branding, usage metering
**Critical role:** Every domain service reads tenant context from this service (via Redis cache) on every request to resolve the correct DB schema, feature flags, and plan limits

---

### Ingestion Service
**Owns:** Raw validated training attendance, assessment score, and competency milestone records
**Data sources ingested:**
- Employee training attendance records (from LMS or HR systems via API)
- Periodic assessment scores (from assessment platforms)
- Competency-level learning milestones (from competency frameworks or LMS)

**Key rule:** Never calls Employee Profile Service directly — publishes `data.ingested` events only

---

### Employee Profile Service
**Owns:** Aggregated employee learning profiles, competency performance metrics, trend history

**Calculated metrics per employee:**
- Training attendance percentage (rolling 30-day, current period, all-time)
- Assessment average per competency / training module
- Score trend direction (improving / stable / declining)
- Competency milestone completion rate
- Peer comparison index (anonymised, within same department / role)

**Key rule:** Never reads raw attendance or assessment data directly — consumes `data.ingested` events and builds its own aggregated view

---

### Risk Engine Service
**Owns:** Risk assessment records, risk scoring logic
**Supported risk rule types:**

| Rule Type | Example |
|---|---|
| Attendance-based | Training attendance < 75 % in last 30 days |
| Score-based | Two consecutive failing assessments in a competency |
| Trend-based | 20 % score decline over 60 days |
| Milestone-based | Critical competency milestone not met by required date |
| Composite | Low attendance AND low assessment scores simultaneously |
| Compliance deadline | At-risk flag within 4 weeks of regulatory certification deadline |

---

### Rule Management Service
**Owns:** Competency risk rule definitions, rule versions, rule audit trail
**Separated from Risk Engine** so L&D Administrators can edit, test, and version rules without touching execution logic

**Sample rule definition (JSON):**
```json
{
  "ruleId":      "COMP_001",
  "ruleName":    "Multiple High-Risk Competency Factors",
  "severity":    "CRITICAL",
  "conditions": {
    "operator":  "AND",
    "criteria": [
      {
        "metric":   "training_attendance_percentage",
        "period":   "30_days",
        "operator": "less_than",
        "value":    80
      },
      {
        "metric":   "competency_average_score",
        "period":   "30_days",
        "operator": "less_than",
        "value":    60
      }
    ]
  },
  "actions": {
    "alert":        ["trainer", "ld_manager", "line_manager"],
    "intervention": ["remedial_training", "coaching_assignment"]
  },
  "applicableTo": {
    "departments":  "all",
    "competencies": "all"
  }
}
```

---

### Intervention Service
**Owns:** Interventions, training sessions, coaching assignments, outcomes

**Intervention types supported (per problem statement):**
- Remedial training sessions
- Coaching and mentoring assignments

```mermaid
stateDiagram-v2
    [*] --> Recommended : risk.detected consumed
    Recommended --> Pending_Approval : Trainer submits
    Pending_Approval --> Active : L&D Manager approves
    Pending_Approval --> Rejected : L&D Manager rejects
    Active --> Completed : All sessions done
    Active --> Cancelled : L&D Admin cancels
    Completed --> Evaluated : Outcomes recorded
    Evaluated --> [*]
```

---

### Reporting Service
**Owns:** Compliance report templates, generated report metadata, L&D reporting aggregates

**Report types:**
- Employee competency progress reports
- At-risk employee lists with risk factors and competency gaps
- Intervention effectiveness summary (remedial training vs coaching)
- Training attendance compliance reports
- Competency achievement reports by department / role
- Regulatory certification readiness reports
- Executive L&D performance summary

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
    SVC->>SVC: Apply db_schema to all DB queries
    SVC->>SVC: Enforce feature_flags + plan_limits
```

---

### Security Architecture

| Layer | Control |
|---|---|
| Edge | WAF (OWASP rules), DDoS protection, TLS 1.3 |
| API Gateway | JWT validation, tenant resolution, per-tenant rate limiting |
| Service-to-service | mTLS via Istio / Linkerd service mesh |
| Database | Schema-level or row-level isolation, pgaudit logging |
| Data at rest | AES-256 encryption, column-level encryption for employee PII |
| Secrets | HashiCorp Vault — no secrets in env vars or code |
| Compliance | GDPR · SOC 2 Type II · HR data privacy regulations per jurisdiction |

---

### Role Permissions Matrix

| Feature | Trainer | L&D Administrator | L&D Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| View own employees' profiles | ✅ | ✅ | ✅ | ✅ (own only) |
| View all employee profiles | ✅ | ✅ | ✅ | ❌ |
| Define / edit competency risk rules | ❌ | ✅ | ❌ | ❌ |
| Assign remedial training / coaching | ✅ | ✅ | ✅ | ❌ |
| Approve interventions | ❌ | ✅ | ✅ | ❌ |
| Generate compliance reports | ❌ | ✅ | ❌ | ❌ |
| View L&D dashboards | ✅ | ✅ | ✅ | ✅ (limited) |
| Manage users / roles | ❌ | ✅ | ❌ | ❌ |
| Configure tenant settings | ❌ | ✅ | ❌ | ❌ |
