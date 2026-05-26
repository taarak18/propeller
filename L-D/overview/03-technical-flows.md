# Technical Flows

# Technical Flows — SaaS Multi-Tenant Microservices

## 1. Tenant Onboarding & Provisioning Flow

```mermaid
sequenceDiagram
    actor Admin as New Customer
    participant GW as API Gateway
    participant TMS as Tenant Management Service
    participant AUTH as Auth Service
    participant DB as PostgreSQL
    participant KAFKA as Kafka
    participant NOTIF as Notification Service
    participant ALL as All Domain Services

    Admin->>GW: POST /tms/v1/tenants (registration payload)
    GW->>TMS: Forward request
    TMS->>TMS: Validate request & check for duplicates
    TMS->>DB: Create tenant record (status=provisioning)
    TMS-->>GW: 201 Created { tenant_id, provisioning_job_id }
    GW-->>Admin: 201 Created { tenant_id, estimated_ready: 5min }

    Note over TMS: Async provisioning begins
    TMS->>DB: Create DB schema / dedicated DB
    TMS->>DB: Run schema migrations
    TMS->>DB: Seed default risk rules & report templates
    TMS->>AUTH: Create admin user for tenant
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
    actor User
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant REDIS as Redis Cache
    participant TMS as Tenant Management Service
    participant SVC as Domain Service
    participant DB as Tenant Database

    User->>GW: GET /api/v1/learners + Bearer JWT
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

    GW->>GW: Check feature_flags — is endpoint enabled for plan?
    GW->>GW: Check rate limit for tenant (ratelimit:{tenant_id})

    alt Feature enabled & within rate limit
        GW->>SVC: Forward request + X-Tenant-ID + X-DB-Schema headers
        SVC->>DB: SET search_path = {db_schema}
        DB-->>SVC: Tenant-scoped results
        SVC-->>User: 200 OK { data }
    else Feature not enabled
        GW-->>User: 403 Forbidden { upgrade_url }
    else Rate limit exceeded
        GW-->>User: 429 Too Many Requests { retry_after }
    end
```

---

## 3. Data Ingestion Flow (Tenant-Aware)

```mermaid
sequenceDiagram
    participant EXT as External System
    participant GW as API Gateway
    participant ING as Ingestion Service
    participant VAL as Validator & Normaliser
    participant DB as ingestion-db (tenant schema)
    participant KAFKA as Kafka
    participant PROF as Learner Profile Service

    EXT->>GW: POST /api/v1/ingest/attendance\n+ Bearer token + batch payload
    GW->>GW: Resolve tenant_id from JWT
    GW->>ING: Forward + X-Tenant-ID header
    ING->>ING: Apply tenant db_schema context
    ING->>VAL: Validate schema, completeness, duplicates
    alt Validation passes
        VAL->>DB: Upsert records (tenant-scoped schema)
        ING->>KAFKA: Publish data.ingested\n{ tenant_id, affected_learners[] }
        ING-->>GW: 202 Accepted { job_id }
    else Validation fails
        ING-->>GW: 422 Unprocessable Entity { errors[] }
    end

    KAFKA-->>PROF: Consume data.ingested (filtered by tenant_id)
    PROF->>PROF: Invalidate Redis cache for affected_learners
    PROF->>PROF: Re-aggregate profiles
    PROF->>KAFKA: Publish profile.updated per learner
```

---

## 4. Risk Detection Flow (Tenant-Isolated)

```mermaid
flowchart TD
    A([profile.updated event\n{ tenant_id, learner_id, profile_snapshot }]) --> B[Risk Engine Consumer]
    B --> C[Load active rules for tenant\nfrom rules-db via Rule Mgmt API]
    C --> D[Rules cached in Redis?\nrules:{tenant_id}:active — TTL=5min]
    D -->|Cache hit| E[Execute rule engine\nagainst profile snapshot]
    D -->|Cache miss| F[Fetch from rules-db\nCache result]
    F --> E

    E --> G{Any rules matched?}
    G -->|No rules matched| H[Risk Level = NONE\nUpdate risk_assessments record]
    G -->|Rules matched| I[Compute weighted risk score]
    I --> J{Classify risk level}
    J -->|Score ≥ 85| K[CRITICAL]
    J -->|Score 65–84| L[HIGH]
    J -->|Score 40–64| M[MEDIUM]
    J -->|Score < 40| N[LOW]

    K & L & M & N --> O[Persist to risk-db\nwith tenant_id]
    O --> P{Risk ≥ HIGH?}
    P -->|Yes| Q[Publish risk.detected\n{ tenant_id, learner_id, risk_level }]
    P -->|CRITICAL| R[Publish risk.escalated\n{ tenant_id, immediate_action=true }]
    P -->|No| S([End])

    Q --> T[Intervention Service\nrecommends interventions]
    Q --> U[Notification Service\nalerts teacher + counsellor + parent]
    Q --> V[Reporting Service\nupdates at-risk aggregates]
    R --> W[Notification Service\nurgent alerts to all targets]
```

---

## 5. Intervention Lifecycle Flow (Multi-Tenant)

```mermaid
sequenceDiagram
    actor Teacher
    actor Counsellor
    participant GW as API Gateway
    participant INT as Intervention Service
    participant KAFKA as Kafka
    participant NOTIF as Notification Service
    participant RPT as Reporting Service
    participant RISK as Risk Engine Service

    Note over Teacher: Receives risk.detected alert
    Teacher->>GW: POST /api/v1/interventions\n{ learner_id, type, schedule }
    GW->>INT: Create intervention (tenant-scoped)
    INT->>INT: Save to intervention-db (status=pending_approval)
    INT->>KAFKA: Publish intervention.assigned
    KAFKA-->>NOTIF: Notify Counsellor
    NOTIF-->>Counsellor: 🔔 Pending approval alert

    Counsellor->>GW: PUT /api/v1/interventions/{id}/approve
    GW->>INT: Update status = active
    INT->>KAFKA: Publish intervention.approved
    KAFKA-->>NOTIF: Notify Teacher + Learner/Parent

    loop Each Session
        Teacher->>GW: POST /api/v1/interventions/{id}/sessions
        GW->>INT: Log session attendance & notes
        INT->>KAFKA: Publish intervention.session.logged
        KAFKA-->>RPT: Update session count in reporting aggregates
    end

    Teacher->>GW: PUT /api/v1/interventions/{id}/complete
    GW->>INT: Mark completed, record outcomes
    INT->>INT: Calculate improvement_percentage
    INT->>KAFKA: Publish intervention.completed\n{ pre/post metrics, outcomes[] }
    KAFKA-->>RISK: Re-evaluate learner risk profile
    KAFKA-->>RPT: Update effectiveness aggregates
    KAFKA-->>NOTIF: Notify all stakeholders
    RISK->>KAFKA: Publish risk.resolved (if improvement confirmed)
```

---

## 6. Compliance Report Generation Flow (Tenant-Scoped)

```mermaid
flowchart TD
    A([Scheduled trigger\nCron or Manual]) --> B[Reporting Service\nLoad tenant report config]
    B --> C[Select report template\nTenant custom or standard]
    C --> D[Read from reporting-db\ntenant-scoped aggregates]
    D --> E{Data fresh enough?\nLast sync < 1hr ago?}
    E -->|Stale| F[Trigger data refresh\nfrom event-sourced aggregates]
    E -->|Fresh| G[Assemble report dataset]
    F --> G
    G --> H[Render report\nPDF / Excel / CSV]
    H --> I[Validate report\nChecksum + accuracy check]
    I --> J{Validation passed?}
    J -->|Yes| K[Store in object storage\ns3://tenant-reports/{tenant_id}/]
    J -->|No| L[Emit error alert\nHalt generation]
    K --> M[Persist metadata to reporting-db]
    M --> N[Publish report.generated event]
    N --> O[Notification Service\nEmail + portal notification]
    N --> P[Audit Service\nLog: who · when · what · checksum]
```

---

## 7. Tenant Plan Upgrade Flow

```mermaid
sequenceDiagram
    actor Admin as Tenant Admin
    participant GW as API Gateway
    participant TMS as Tenant Management Service
    participant KAFKA as Kafka
    participant ALL as All Domain Services
    participant DB as Database Infrastructure

    Admin->>GW: POST /tms/v1/tenants/{id}/subscription/upgrade\n{ new_plan: enterprise }
    GW->>TMS: Process upgrade request
    TMS->>TMS: Validate billing & payment
    TMS->>TMS: Create migration job
    TMS-->>Admin: 200 OK { migration_job_id, tasks[], est_time: 30min }

    Note over TMS,DB: Async migration begins
    TMS->>DB: Provision dedicated PostgreSQL instance
    TMS->>DB: Clone data from shared schema to dedicated DB
    TMS->>DB: Validate data integrity post-migration
    TMS->>DB: Switch connection string to dedicated DB
    TMS->>TMS: Enable enterprise feature flags
    TMS->>DB: Provision dedicated K8s namespace
    TMS->>KAFKA: Publish tenant.plan.upgraded\n{ previous: pro, new: enterprise, feature_flags }
    KAFKA-->>ALL: All services refresh tenant context cache
    TMS->>TMS: Update billing in Stripe
    TMS->>DB: Archive old shared schema data (post-cutover)
```

---

## 8. Authentication Flow — Multi-Tenant SSO (Enterprise)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant IDP as Tenant IdP\n(SAML / OIDC)
    participant TMS as Tenant Management Service
    participant REDIS as Redis

    User->>Browser: Navigate to learn.springfield.edu
    Browser->>GW: GET /auth/login?tenant=springfield
    GW->>AUTH: Resolve tenant SSO config
    AUTH->>TMS: GET /tenants/{tenant_id}/context
    TMS-->>AUTH: { sso_type: saml, idp_metadata_url }
    AUTH-->>Browser: Redirect to IdP login page
    User->>IDP: Authenticate (username + MFA)
    IDP-->>Browser: SAML assertion / OIDC token
    Browser->>GW: POST /auth/saml/{tenant_id}/acs
    GW->>AUTH: Validate SAML assertion
    AUTH->>AUTH: Map IdP attributes → user role
    AUTH->>AUTH: Auto-provision user if new (if enabled)
    AUTH->>REDIS: Store session
    AUTH-->>Browser: JWT access + refresh tokens
    Browser->>GW: All subsequent requests + Bearer JWT
```

---

## 9. Event Bus — Tenant Isolation Guarantee

```mermaid
flowchart LR
    subgraph PUB["Publisher — Risk Engine Service"]
        MSG["Message:\n{\n  tenant_id: 'tenant_A',\n  event_type: 'risk.detected',\n  payload: { learner_id, risk_level }\n}"]
    end

    subgraph KAFKA["Kafka\nTopic: tenant_A.risk.risk.detected"]
        P0[Partition 0\ntenant_A messages]
        P1[Partition 1\ntenant_B messages]
    end

    subgraph CON["Consumers"]
        INT2[Intervention Service\nConsumer Group: intervention-svc\nFILTER: tenant_id == own context]
        NOTIF2[Notification Service\nConsumer Group: notification-svc\nFILTER: tenant_id == own context]
        RPT2[Reporting Service\nConsumer Group: reporting-svc\nFILTER: tenant_id == own context]
    end

    MSG --> P0
    P0 --> INT2 & NOTIF2 & RPT2

    note1[/"⚠️ Rule: Each consumer MUST\ncheck tenant_id before processing.\nA consumer for Tenant A MUST\nnever process Tenant B messages."/]
```
