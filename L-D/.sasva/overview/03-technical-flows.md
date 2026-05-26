# Technical Flows

# Technical Flows — Corporate L&D SaaS Multi-Tenant

## 1. Tenant (Organisation) Onboarding & Provisioning Flow

```mermaid
sequenceDiagram
    actor Admin as L&D Administrator (New Customer)
    participant GW as API Gateway
    participant TMS as Tenant Management Service
    participant AUTH as Auth Service
    participant DB as PostgreSQL
    participant KAFKA as Kafka
    participant NOTIF as Notification Service
    participant ALL as All Domain Services

    Admin->>GW: POST /tms/v1/tenants (organisation registration payload)
    GW->>TMS: Forward request
    TMS->>TMS: Validate request & check for duplicates
    TMS->>DB: Create tenant record (status = provisioning)
    TMS-->>GW: 201 Created { tenant_id, provisioning_job_id }
    GW-->>Admin: 201 Created { tenant_id, estimated_ready: 5 min }

    Note over TMS: Async provisioning begins
    TMS->>DB: Create DB schema / dedicated DB
    TMS->>DB: Run schema migrations
    TMS->>DB: Seed default competency risk rules & compliance report templates
    TMS->>AUTH: Create L&D Admin user for organisation
    AUTH-->>TMS: { user_id, temp_password }
    TMS->>KAFKA: Publish tenant.provisioned event
    KAFKA-->>ALL: All domain services initialise tenant context
    TMS->>DB: Update tenant status = active
    TMS->>NOTIF: Send welcome email with portal URL + credentials
    NOTIF-->>Admin: 📧 Welcome email
```

---

## 2. Multi-Tenant Request Routing Flow

```mermaid
sequenceDiagram
    actor User as Trainer / L&D Admin / Employee
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant REDIS as Redis Cache
    participant TMS as Tenant Management Service
    participant SVC as Domain Service
    participant DB as Tenant Database (org-scoped)

    User->>GW: GET /api/v1/employees + Bearer JWT
    GW->>AUTH: Validate JWT signature & expiry
    AUTH-->>GW: { user_id, tenant_id, roles, plan }
    GW->>REDIS: GET tenant_ctx:{tenant_id}

    alt Cache HIT
        REDIS-->>GW: { db_schema, feature_flags, limits }
    else Cache MISS
        GW->>TMS: GET /tenants/{tenant_id}/context
        TMS-->>GW: Tenant context JSON
        GW->>REDIS: SET tenant_ctx:{tenant_id} TTL=60s
    end

    GW->>GW: Check feature_flags — endpoint enabled for plan?
    GW->>GW: Check rate limit for tenant

    alt Feature enabled & within rate limit
        GW->>SVC: Forward + X-Tenant-ID + X-DB-Schema headers
        SVC->>DB: SET search_path = {db_schema}
        DB-->>SVC: Organisation-scoped results
        SVC-->>User: 200 OK { data }
    else Feature not enabled for plan
        GW-->>User: 403 Forbidden { upgrade_url }
    else Rate limit exceeded
        GW-->>User: 429 Too Many Requests { retry_after }
    end
```

---

## 3. Training Data Ingestion Flow

```mermaid
sequenceDiagram
    participant LMS as LMS / HR System
    participant GW as API Gateway
    participant ING as Ingestion Service
    participant VAL as Validator & Normaliser
    participant DB as ingestion-db (org schema)
    participant KAFKA as Kafka
    participant PROF as Employee Profile Service

    LMS->>GW: POST /api/v1/ingest/training-attendance\n+ Bearer token + batch payload
    GW->>GW: Resolve tenant_id from JWT
    GW->>ING: Forward + X-Tenant-ID header
    ING->>ING: Apply tenant db_schema context
    ING->>VAL: Validate schema, completeness, duplicates
    alt Validation passes
        VAL->>DB: Upsert training attendance records (org-scoped)
        ING->>KAFKA: Publish data.ingested\n{ tenant_id, data_type: training_attendance,\n  affected_employees[] }
        ING-->>GW: 202 Accepted { job_id }
    else Validation fails
        ING-->>GW: 422 Unprocessable Entity { errors[] }
    end

    KAFKA-->>PROF: Consume data.ingested (filtered by tenant_id)
    PROF->>PROF: Invalidate Redis cache for affected employees
    PROF->>PROF: Re-aggregate learning profiles
    PROF->>KAFKA: Publish profile.updated per employee
```

**Three ingestion endpoints (per problem statement):**

| Endpoint | Data Type | Source |
|---|---|---|
| `POST /api/v1/ingest/training-attendance` | Employee training attendance records | LMS / HR system |
| `POST /api/v1/ingest/assessments` | Periodic assessment scores | Assessment platform |
| `POST /api/v1/ingest/competency-milestones` | Competency-level learning milestones | LMS / Competency framework |

---

## 4. Employee Risk Detection Flow

```mermaid
flowchart TD
    A([profile.updated event<br/>tenant_id, employee_id, profile_snapshot]) --> B[Risk Engine Consumer]
    B --> C[Load active competency rules for org<br/>from rules-db via Rule Mgmt API]
    C --> D{Rules cached?<br/>rules:tenant_id:active - TTL=5min}
    D -->|Cache hit| E[Execute rule engine<br/>against profile snapshot]
    D -->|Cache miss| F[Fetch from rules-db and cache]
    F --> E

    E --> G{Any rules matched?}
    G -->|No rules matched| H[Risk Level = NONE<br/>Update risk_assessments record]
    G -->|Rules matched| I[Compute weighted risk score]
    I --> J{Classify risk level}
    J -->|Score >= 85| K[CRITICAL<br/>Competency compliance at risk]
    J -->|Score 65-84| L[HIGH<br/>Significant competency gap]
    J -->|Score 40-64| M[MEDIUM<br/>Early warning]
    J -->|Score < 40| N[LOW<br/>Monitor]

    K & L & M & N --> O[Persist to risk-db with tenant_id]
    O --> P{Risk >= HIGH?}
    P -->|Yes| Q[Publish risk.detected<br/>tenant_id, employee_id, risk_level,<br/>recommended_interventions]
    P -->|CRITICAL| R[Publish risk.escalated<br/>immediate_action = true]
    P -->|No| S([End])

    Q --> T[Intervention Service<br/>recommends remedial training or coaching]
    Q --> U[Notification Service<br/>alerts trainer + L&D manager + line manager]
    Q --> V[Reporting Service<br/>updates at-risk employee aggregates]
    R --> W[Notification Service<br/>urgent alerts to all targets]
```

---

## 5. Intervention Lifecycle Flow — Remedial Training & Coaching

```mermaid
sequenceDiagram
    actor Trainer
    actor LDManager as L&D Manager
    participant GW as API Gateway
    participant INT as Intervention Service
    participant KAFKA as Kafka
    participant NOTIF as Notification Service
    participant RPT as Reporting Service
    participant RISK as Risk Engine Service

    Note over Trainer: Receives risk.detected alert for employee
    Trainer->>GW: POST /api/v1/interventions\n{ employee_id, type: remedial_training,\n  competency, schedule }
    GW->>INT: Create intervention (org-scoped)
    INT->>INT: Save to intervention-db (status = pending_approval)
    INT->>KAFKA: Publish intervention.assigned
    KAFKA-->>NOTIF: Notify L&D Manager
    NOTIF-->>LDManager: 🔔 Pending approval — remedial training request

    LDManager->>GW: PUT /api/v1/interventions/{id}/approve
    GW->>INT: Update status = active
    INT->>KAFKA: Publish intervention.approved
    KAFKA-->>NOTIF: Notify Trainer + Employee + Line Manager

    loop Each Training Session / Coaching Session
        Trainer->>GW: POST /api/v1/interventions/{id}/sessions
        GW->>INT: Log session attendance, competency notes
        INT->>KAFKA: Publish intervention.session.logged
        KAFKA-->>RPT: Update session count in L&D aggregates
    end

    Trainer->>GW: PUT /api/v1/interventions/{id}/complete
    GW->>INT: Mark completed, record pre/post competency outcomes
    INT->>INT: Calculate improvement_percentage per metric
    INT->>KAFKA: Publish intervention.completed\n{ pre/post training_attendance_%, competency_score }
    KAFKA-->>RISK: Re-evaluate employee risk profile
    KAFKA-->>RPT: Update intervention effectiveness aggregates
    KAFKA-->>NOTIF: Notify all stakeholders of outcome
    RISK->>KAFKA: Publish risk.resolved (if competency improvement confirmed)
```

---

## 6. Compliance Report Generation Flow

```mermaid
flowchart TD
    A([Scheduled trigger<br/>Cron or Manual by L&D Admin]) --> B[Reporting Service<br/>Load org report config]
    B --> C[Select compliance report template<br/>Org-custom or standard regulatory format]
    C --> D[Read from reporting-db<br/>Org-scoped L&D aggregates]
    D --> E{Data fresh?<br/>Last sync less than 1hr?}
    E -->|Stale| F[Refresh from event-sourced aggregates]
    E -->|Fresh| G[Assemble compliance dataset<br/>Attendance / Scores / Competency gaps / Interventions]
    F --> G
    G --> H[Render report<br/>PDF / Excel / CSV]
    H --> I[Validate report<br/>Checksum + accuracy check]
    I --> J{Validation passed?}
    J -->|Yes| K[Store in object storage<br/>s3://org-reports/tenant_id/]
    J -->|No| L[Emit error alert to L&D Admin<br/>Halt generation]
    K --> M[Persist metadata to reporting-db]
    M --> N[Publish report.generated event]
    N --> O[Notification Service<br/>Email + portal notification to L&D Admin]
    N --> P[Audit Service<br/>Immutable log: who / when / what / checksum]
```

---

## 7. Competency Rule Authoring & Activation Flow

```mermaid
sequenceDiagram
    actor LDAdmin as L&D Administrator
    participant GW as API Gateway
    participant RULE as Rule Management Service
    participant REDIS as Redis
    participant RISK as Risk Engine Service

    LDAdmin->>GW: POST /api/v1/rules\n{ ruleName, severity, conditions, applicableTo }
    GW->>RULE: Create rule draft (status = draft)
    RULE->>RULE: Validate rule schema & logic
    RULE-->>LDAdmin: 201 Created { rule_id, version: 1 }

    LDAdmin->>GW: POST /api/v1/rules/{rule_id}/test\n{ sample_employee_profiles[] }
    GW->>RULE: Run rule against sample profiles
    RULE->>RULE: Execute rule conditions on each profile
    RULE-->>LDAdmin: Test results { matched: 3/10, false_positive_rate: 0% }

    LDAdmin->>GW: PUT /api/v1/rules/{rule_id}/activate
    GW->>RULE: Set is_active = true, persist version
    RULE->>REDIS: Invalidate rules:{tenant_id}:active cache
    RULE-->>LDAdmin: 200 OK { rule activated }

    Note over RISK: Next profile.updated event consumed
    RISK->>REDIS: Load updated rules cache (includes new rule)
    RISK->>RISK: New rule evaluated on all subsequent profile updates
```

---

## 8. SSO Authentication Flow (Enterprise — Corporate Identity Provider)

```mermaid
sequenceDiagram
    actor Employee
    participant Browser
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant IDP as Corporate IdP\n(Azure AD / Okta / SAML)
    participant TMS as Tenant Management Service
    participant REDIS as Redis

    Employee->>Browser: Navigate to learn.acmecorp.com
    Browser->>GW: GET /auth/login?tenant=acme_corp
    GW->>AUTH: Resolve tenant SSO config
    AUTH->>TMS: GET /tenants/{tenant_id}/context
    TMS-->>AUTH: { sso_type: saml, idp_metadata_url }
    AUTH-->>Browser: Redirect to corporate IdP
    Employee->>IDP: Authenticate with corporate credentials + MFA
    IDP-->>Browser: SAML assertion with employee attributes
    Browser->>GW: POST /auth/saml/{tenant_id}/acs
    GW->>AUTH: Validate SAML assertion
    AUTH->>AUTH: Map IdP attributes → L&D role\n(trainer / ld_admin / employee)
    AUTH->>AUTH: Auto-provision employee user if new
    AUTH->>REDIS: Store session
    AUTH-->>Browser: JWT access + refresh tokens
    Browser->>GW: All subsequent requests + Bearer JWT
```

---

## 9. Plan Upgrade Flow — Corporate Tenant

```mermaid
sequenceDiagram
    actor LDAdmin as L&D Administrator
    participant GW as API Gateway
    participant TMS as Tenant Management Service
    participant KAFKA as Kafka
    participant ALL as All Domain Services
    participant DB as Database Infrastructure

    LDAdmin->>GW: POST /tms/v1/tenants/{id}/subscription/upgrade\n{ new_plan: enterprise }
    GW->>TMS: Process upgrade request
    TMS->>TMS: Validate billing & payment
    TMS-->>LDAdmin: 200 OK { migration_job_id, est_time: 30min }

    Note over TMS,DB: Async migration
    TMS->>DB: Provision dedicated PostgreSQL for organisation
    TMS->>DB: Migrate data from shared schema to dedicated DB
    TMS->>DB: Validate data integrity post-migration
    TMS->>DB: Switch connection string to dedicated DB
    TMS->>TMS: Enable enterprise feature flags\n(SSO · ML risk scoring · unlimited rules)
    TMS->>DB: Provision dedicated K8s namespace
    TMS->>KAFKA: Publish tenant.plan.upgraded
    KAFKA-->>ALL: All services refresh tenant context cache
    TMS->>TMS: Update billing in Stripe
```
