# Technical Flows

## Corporate L&D SaaS — Multi-Tenant (Production-Ready v2.0)

> **Changes from v1.0:** Tenant provisioning replaced with Temporal saga (with compensation). JWT validation moved to Gateway-local JWKS. Ingestion flow adds `Idempotency-Key` handling. Training data ingestion now uses outbox + Debezium CDC. Employee risk detection adds human-review gate (GDPR Art.22). Intervention lifecycle uses Temporal workflow. New flows: Right-to-erasure saga, Consent capture, Automated plan upgrade saga. Reporting read model populated via CDC.

---

## 1. Tenant Provisioning — Temporal Saga

> **v2 change:** Eight side-effecting steps are now orchestrated by a **Temporal workflow** with compensating actions. Partial failure at any step triggers rollback of completed steps.

```mermaid
stateDiagram-v2
    [*] --> ValidateRequest
    ValidateRequest --> CreateTenantRecord : valid
    ValidateRequest --> [*] : invalid - 422

    CreateTenantRecord --> ProvisionDatabase
    ProvisionDatabase --> RunMigrations
    RunMigrations --> SeedDefaultRules
    SeedDefaultRules --> SeedReportTemplates
    SeedTemplates: SeedReportTemplates
    SeedReportTemplates --> CreateAdminUser
    CreateAdminUser --> PublishProvisionedEvent
    PublishProvisionedEvent --> SendWelcomeEmail
    SendWelcomeEmail --> Active

    ProvisionDatabase --> Compensate : failure
    RunMigrations --> Compensate : failure
    SeedDefaultRules --> Compensate : failure
    SeedReportTemplates --> Compensate : failure
    CreateAdminUser --> Compensate : failure
    Compensate --> MarkProvisioning_Failed
    MarkProvisioning_Failed --> [*]

    Active --> [*]
```

**Sequence (happy path):**

```mermaid
sequenceDiagram
    actor Admin as L&D Administrator (New Customer)
    participant GW as Kong API Gateway
    participant TMS as Tenant Management Service
    participant TEMP as Temporal Server
    participant DB as PostgreSQL
    participant AUTH as Auth Service
    participant KAFKA as Kafka
    participant NOTIF as Notification Service

    Admin->>GW: POST /tms/v1/tenants
    GW->>TMS: Forward (no JWT required — public registration)
    TMS->>DB: INSERT tenant (status=provisioning)
    TMS->>TEMP: StartWorkflow(TenantProvisioningWorkflow, tenant_id)
    TMS-->>Admin: 201 { tenant_id, workflow_id, estimated_ready: 5 min }

    Note over TEMP: Durable saga execution
    TEMP->>DB: CreateDatabaseSchema / CreateDedicatedDB
    TEMP->>DB: RunSchemaMigrations
    TEMP->>DB: SeedDefaultCompetencyRules (15 starter rules)
    TEMP->>DB: SeedReportTemplates
    TEMP->>AUTH: CreateAdminUser activity
    AUTH-->>TEMP: { user_id, temp_password }
    TEMP->>DB: UPDATE tenant status=active
    TEMP->>KAFKA: Publish tenant.provisioned (via outbox)
    TEMP->>NOTIF: SendWelcomeEmail activity
    NOTIF-->>Admin: Welcome email + portal URL + temp credentials
```

---

## 2. Multi-Tenant Request Routing — JWKS-Local JWT Validation

> **v2 change:** Gateway validates JWT locally using cached JWKS. Auth Service is no longer called on every request.

```mermaid
sequenceDiagram
    actor User as Trainer / L&D Admin / Employee
    participant GW as Kong API Gateway
    participant REDIS as Redis Cache
    participant AUTH as Auth Service
    participant SVC as Domain Service
    participant DB as Tenant Database

    User->>GW: GET /api/v1/employees + Bearer JWT
    GW->>GW: Extract tenant_id claim from JWT (unverified)
    GW->>REDIS: GET jwks:{tenant_id} (TTL=5min)

    alt JWKS Cache HIT
        REDIS-->>GW: JWKS public keys
    else JWKS Cache MISS
        GW->>AUTH: GET /auth/v1/.well-known/jwks.json?tenant={tenant_id}
        AUTH-->>GW: JWKS
        GW->>REDIS: SET jwks:{tenant_id} TTL=5min
    end

    GW->>GW: Verify JWT signature, exp, iat locally
    GW->>REDIS: GET tenant_ctx:{tenant_id} (TTL=60s)

    alt Tenant Context HIT
        REDIS-->>GW: db_schema, feature_flags, plan_limits
    else Tenant Context MISS
        GW->>TMS: GET /tenants/{tenant_id}/context
        GW->>REDIS: SET tenant_ctx:{tenant_id} TTL=60s
    end

    GW->>GW: Check feature_flag for endpoint (via Unleash SDK)
    GW->>GW: Check per-tenant rate limit

    alt Enabled and within rate limit
        GW->>SVC: Forward + X-Tenant-ID + X-DB-Schema + X-User-ID + X-Roles
        SVC->>DB: SET search_path = {db_schema}; execute query
        SVC-->>User: 200 OK
    else Feature disabled for plan
        GW-->>User: 403 Forbidden { upgrade_url }
    else Rate limit exceeded
        GW-->>User: 429 Too Many Requests { retry_after }
    end
```

---

## 3. Training Data Ingestion — Idempotent + Outbox

> **v2 changes:** `Idempotency-Key` header required. Duplicate detection via `ingestion_jobs.idempotency_key`. Outbox + Debezium replaces direct Kafka publish.

```mermaid
sequenceDiagram
    participant LMS as LMS / HRIS / File Upload
    participant GW as Kong API Gateway
    participant ING as Ingestion Service
    participant DB as ingestion-db
    participant OBX as ingestion_outbox
    participant DBZ as Debezium CDC
    participant KAFKA as Kafka
    participant PROF as Employee Profile Service

    LMS->>GW: POST /api/v1/ingest/training-attendance\n+ Idempotency-Key: {uuid}\n+ X-Tenant-ID: {tenant}\n+ batch payload (JSON or CSV)
    GW->>ING: Forward
    ING->>DB: SELECT FROM ingestion_jobs WHERE idempotency_key = ?
    alt Already processed
        DB-->>ING: Row found
        ING-->>LMS: 200 Already Processed { job_id }
    else New request
        ING->>ING: Validate schema, completeness, duplicates
        alt Validation passes
            ING->>DB: BEGIN TX
            ING->>DB: INSERT ingestion_job (status=processing)
            ING->>DB: UPSERT raw_training_attendance_staging (org-scoped)
            ING->>OBX: INSERT outbox event { data.ingested, tenant_id, affected_employees[] }
            ING->>DB: UPDATE ingestion_job status=completed
            ING->>DB: COMMIT
            ING-->>LMS: 202 Accepted { job_id }
            DBZ->>OBX: Capture outbox row (CDC)
            DBZ->>KAFKA: Publish data.ingested event (exactly-once)
            KAFKA-->>PROF: Consume event
            PROF->>PROF: Invalidate Redis profile cache for affected employees
            PROF->>PROF: Rebuild curated training_attendance rows
            PROF->>PROF: Publish profile.updated via outbox
        else Validation fails
            ING-->>LMS: 422 Unprocessable Entity { errors[] }
        end
    end
```

**Three ingestion endpoints (all require `Idempotency-Key`):**

| Endpoint | Data Type | Formats |
|---|---|---|
| `POST /api/v1/ingest/training-attendance` | Employee training attendance records | JSON batch, CSV multipart |
| `POST /api/v1/ingest/assessments` | Periodic assessment scores | JSON batch, CSV multipart |
| `POST /api/v1/ingest/competency-milestones` | Competency milestone updates | JSON batch |

---

## 4. Employee Risk Detection — With Human-Review Gate

> **v2 change:** CRITICAL and HIGH risk assessments require a human-review record before notifications are dispatched (GDPR Art.22, CCPA/CPRA, DPDP opt-out).

```mermaid
flowchart TD
    A([profile.updated event\ntenant_id - employee_id - snapshot]) --> B[Risk Engine Consumer]
    B --> C{Employee opted out of\nrisk profiling?}
    C -->|Yes - opt_out flag| S([Skip - log suppression to audit])
    C -->|No| D[Load active rules via Rule Mgmt API\ncached in Redis TTL=5min]
    D --> E[Execute rule conditions against profile snapshot]
    E --> F{Rules matched?}
    F -->|None| G[Risk Level = NONE\nUpdate risk_assessments]
    F -->|Matched| H[Compute weighted risk score]
    H --> I{Classify level}
    I -->|Score 85+| J[CRITICAL]
    I -->|Score 65-84| K[HIGH]
    I -->|Score 40-64| L[MEDIUM]
    I -->|Score below 40| M[LOW]

    J & K --> N[Create risk_reviews row\nrequires_human_review = TRUE\nstatus = PENDING]
    N --> O[Publish risk.detected\nwith requires_review = true]
    O --> P[Notification Service\nAlert Trainer + L&D Manager only\nNOT employee yet]
    P --> Q{Human review completed?}
    Q -->|CONFIRMED or OVERRIDDEN| R[Dispatch full notifications\nEmployee + Manager + Line Manager]
    Q -->|DISMISSED| T([Mark false positive - no notification])
    Q -->|Not actioned in 48h| U[Temporal timer fires\nEscalate to L&D Admin]

    L & M --> V[Persist to risk-db\nPublish risk.detected]
    V --> W[Notification Service\nStandard alert]
    V --> X[Reporting Service\nUpdate at-risk aggregates]
```

---

## 5. Intervention Lifecycle — Temporal Workflow

> **v2 change:** Core workflow now runs as a Temporal durable workflow. Service holds domain state; Temporal handles orchestration, timers, and escalation.

```mermaid
sequenceDiagram
    actor Trainer
    actor LDMgr as L&D Manager
    participant GW as Kong API Gateway
    participant INT as Intervention Service
    participant TEMP as Temporal Server
    participant KAFKA as Kafka
    participant NOTIF as Notification Service
    participant RPT as Reporting Service
    participant RISK as Risk Engine

    Note over Trainer: Receives risk.detected alert
    Trainer->>GW: POST /api/v1/interventions\n{ employee_id, type, competency, schedule }
    GW->>INT: Create intervention
    INT->>INT: Save to intervention-db (status=pending_approval)
    INT->>TEMP: StartWorkflow(InterventionWorkflow, intervention_id)
    INT->>KAFKA: Publish intervention.assigned (via outbox)
    KAFKA-->>NOTIF: Notify L&D Manager

    LDMgr->>GW: PUT /api/v1/interventions/{id}/approve
    GW->>INT: Signal Temporal workflow — APPROVED
    INT->>INT: Update status=active
    KAFKA-->>NOTIF: Notify Trainer + Employee + Line Manager

    Note over TEMP: Temporal timer — 48h SLA check
    TEMP->>TEMP: Wait for approval (max 48h)
    alt Not approved in 48h
        TEMP->>INT: Escalate signal
        INT->>KAFKA: Publish intervention.escalated
        KAFKA-->>NOTIF: Alert L&D Admin
    end

    loop Each Training Session
        Trainer->>GW: POST /api/v1/interventions/{id}/sessions
        GW->>INT: Log session attendance + notes
        INT->>KAFKA: Publish intervention.session.logged (outbox)
        KAFKA-->>RPT: Update session count in aggregates
    end

    Trainer->>GW: PUT /api/v1/interventions/{id}/complete
    GW->>INT: Signal Temporal workflow — COMPLETED
    INT->>INT: Record pre/post outcomes + improvement %
    INT->>KAFKA: Publish intervention.completed (outbox)
    KAFKA-->>RISK: Re-evaluate employee risk
    KAFKA-->>RPT: Update effectiveness aggregates
    KAFKA-->>NOTIF: Notify all stakeholders
    RISK->>KAFKA: Publish risk.resolved (if improvement confirmed)
```

---

## 6. Compliance Report Generation — CDC-Backed

> **v2 change:** `reporting-db` is now a CDC-fed read model. Report data is always fresh without polling or manual refresh.

```mermaid
flowchart TD
    A([Cron trigger or Manual by L&D Admin]) --> B[Reporting Service\nLoad tenant report config]
    B --> C[Select template\nStandard or custom regulatory format]
    C --> D[Read from reporting-db\nCDC-fed aggregates]
    D --> E{Aggregates fresh?\nLast CDC event less than 1hr?}
    E -->|Stale - no recent events| F[Trigger force-refresh\nRe-read from profile-db snapshot]
    E -->|Fresh| G[Assemble compliance dataset\nAttendance / Scores / Competency gaps / Interventions]
    F --> G
    G --> H{Employee has risk_profiling_opt_out?}
    H -->|Yes| I[Pseudonymise that employee's data in report]
    H -->|No| J[Include full data]
    I & J --> K[Render report\nPDF - Excel - CSV]
    K --> L[Validate report\nChecksum + data accuracy check]
    L --> M{Passed?}
    M -->|Yes| N[Store in S3 with Object Lock\ns3://reports/tenant_id/YYYY-MM/]
    M -->|No| O[Alert L&D Admin - halt]
    N --> P[Persist metadata to reporting-db]
    P --> Q[Publish report.generated event]
    Q --> R[Notification Service\nEmail + portal alert to L&D Admin]
    Q --> S[Audit Service\nImmutable log: actor - timestamp - checksum]
```

**CDC pipeline feeding reporting-db:**

```mermaid
flowchart LR
    A[(profile-db)] -->|Debezium| K1[Kafka: cdc.profile]
    B[(risk-db)] -->|Debezium| K2[Kafka: cdc.risk]
    C[(intervention-db)] -->|Debezium| K3[Kafka: cdc.intervention]
    K1 & K2 & K3 --> RPT_CON[Reporting CDC Consumer]
    RPT_CON --> RPT_DB[(reporting-db\nDenormalised aggregates)]
```

---

## 7. Right-to-Erasure Saga — Temporal Workflow

> **New in v2.** Satisfies GDPR Art.17, CCPA right-to-delete, DPDP erasure rights. Orchestrated by Temporal. Each service must confirm erasure before the signed deletion certificate is issued.

```mermaid
sequenceDiagram
    actor Emp as Employee
    participant GW as Kong API Gateway
    participant CONSENT as Consent Service
    participant TEMP as Temporal Server
    participant PROF as Employee Profile Service
    participant RISK as Risk Engine
    participant INT as Intervention Service
    participant RPT as Reporting Service
    participant AUDIT as Audit Service
    participant S3 as AWS S3

    Emp->>GW: POST /consent/v1/erasure-requests\n{ employee_id, reason }
    GW->>CONSENT: Create erasure request
    CONSENT->>CONSENT: Validate identity + active interventions check
    CONSENT->>TEMP: StartWorkflow(ErasureWorkflow, { tenant_id, employee_id })
    CONSENT-->>Emp: 202 Accepted { erasure_id, expected_by: 72h }

    Note over TEMP: Erasure saga - all steps must complete
    TEMP->>PROF: AnonymisePII activity\nOverwrite name, email, phone, dob with tokens
    PROF-->>TEMP: Confirmed
    TEMP->>RISK: EraseRiskPII activity\nPseudonymise risk_factors JSONB
    RISK-->>TEMP: Confirmed
    TEMP->>INT: EraseInterventionPII activity\nAnonymise trainer notes
    INT-->>TEMP: Confirmed
    TEMP->>RPT: RedactFromReports activity\nMark reports containing PII as redacted
    RPT-->>TEMP: Confirmed
    TEMP->>AUDIT: RecordErasureEvent activity\nAppend erasure confirmation (immutable)
    AUDIT-->>TEMP: Confirmed
    TEMP->>S3: GenerateDeletionCertificate activity\nSigned PDF with timestamp and service confirmations
    S3-->>TEMP: s3_key
    TEMP->>CONSENT: UpdateErasureRequest status=COMPLETED\ndeletion_certificate_s3_key = {key}
    CONSENT-->>Emp: Erasure complete notification + certificate download link
```

**Notes:**
- Audit log entries for the erased employee are retained (legally required) but `before_state` / `after_state` JSONB fields are tokenised — linkage to the natural person is destroyed
- If any service fails to confirm within the Temporal activity timeout, the saga retries with backoff; after max retries, it alerts the L&D Admin and DPO email on file

---

## 8. Consent Capture & Opt-Out Flow

> **New in v2.** Satisfies GDPR, DPDP Act 2023, CCPA automated-profiling opt-out, PIPEDA consent obligations.

```mermaid
sequenceDiagram
    actor Emp as Employee
    participant GW as Kong API Gateway
    participant CONSENT as Consent Service
    participant KAFKA as Kafka
    participant RISK as Risk Engine
    participant RPT as Reporting Service
    participant AUDIT as Audit Service

    Note over Emp: First login or consent review
    Emp->>GW: GET /consent/v1/disclosures?tenant={id}
    GW->>CONSENT: Fetch disclosure texts for tenant jurisdiction
    CONSENT-->>Emp: Disclosure texts per purpose + legal basis

    Emp->>GW: POST /consent/v1/consents\n{ purposes: [risk_profiling, benchmarking], action: GRANT }
    GW->>CONSENT: Record consents
    CONSENT->>CONSENT: INSERT consents rows per purpose
    CONSENT->>KAFKA: Publish consent.updated (outbox)
    CONSENT-->>Emp: 201 Consents recorded

    KAFKA-->>RISK: Refresh opt-out flag in risk engine
    KAFKA-->>RPT: Update report inclusion flags

    Note over Emp: Later - opt-out of automated risk profiling
    Emp->>GW: DELETE /consent/v1/consents/risk_profiling
    GW->>CONSENT: Withdraw consent for risk_profiling
    CONSENT->>CONSENT: UPDATE consent status=WITHDRAWN
    CONSENT->>CONSENT: UPDATE employees.risk_profiling_opt_out = TRUE
    CONSENT->>KAFKA: Publish consent.withdrawn { purpose: risk_profiling }
    KAFKA-->>RISK: Suppress future risk assessments for employee
    KAFKA-->>RPT: Exclude from profiling-based reports
    CONSENT->>AUDIT: Log consent withdrawal (immutable)
    CONSENT-->>Emp: 200 Opt-out confirmed
```

---

## 9. Competency Rule Authoring & Activation Flow

```mermaid
sequenceDiagram
    actor LDAdmin as L&D Administrator
    participant GW as Kong API Gateway
    participant RULE as Rule Management Service
    participant REDIS as Redis
    participant RISK as Risk Engine Service

    LDAdmin->>GW: POST /api/v1/rules\n{ ruleName, severity, conditions, applicableTo }
    GW->>RULE: Create rule draft (status=draft)
    RULE->>RULE: Validate rule schema + logic
    RULE-->>LDAdmin: 201 { rule_id, version: 1 }

    LDAdmin->>GW: POST /api/v1/rules/{rule_id}/test\n{ sample_employee_profiles[] }
    GW->>RULE: Run rule against sample profiles
    RULE-->>LDAdmin: { matched: 3/10, false_positive_rate: 0% }

    LDAdmin->>GW: PUT /api/v1/rules/{rule_id}/activate
    GW->>RULE: Set is_active=true, version++
    RULE->>REDIS: Invalidate rules:{tenant_id}:active
    RULE-->>LDAdmin: 200 Rule activated

    Note over RISK: Next profile.updated event
    RISK->>REDIS: Load updated rules cache
    RISK->>RISK: New rule evaluated on all subsequent profiles
```

---

## 10. Plan Upgrade — Temporal Saga

> **v2 change:** Plan upgrade is now a Temporal saga with data validation and compensation.

```mermaid
sequenceDiagram
    actor LDAdmin as L&D Administrator
    participant GW as Kong API Gateway
    participant TMS as Tenant Management Service
    participant TEMP as Temporal Server
    participant DB as Database Infrastructure
    participant KAFKA as Kafka

    LDAdmin->>GW: POST /tms/v1/tenants/{id}/subscription/upgrade\n{ new_plan: enterprise }
    GW->>TMS: Process upgrade
    TMS->>TMS: Validate billing + payment
    TMS->>TEMP: StartWorkflow(PlanUpgradeWorkflow, { tenant_id, new_plan })
    TMS-->>LDAdmin: 200 { workflow_id, estimated: 30min }

    Note over TEMP: Saga
    TEMP->>DB: ProvisionDedicatedPostgreSQL
    TEMP->>DB: MigrateDataFromSharedSchema
    TEMP->>DB: ValidateDataIntegrity
    TEMP->>DB: SwitchConnectionString
    TEMP->>TMS: EnableEnterpriseFeatureFlags (SSO, unlimited rules)
    TEMP->>DB: ProvisionDedicatedK8sNamespace
    TEMP->>TMS: UpdateBillingInStripe
    TEMP->>TMS: UPDATE tenant plan=enterprise
    TEMP->>KAFKA: Publish tenant.plan.upgraded (outbox)
    KAFKA-->>AllServices: Refresh tenant context cache
```

---

## 11. SSO Authentication Flow (Enterprise)

```mermaid
sequenceDiagram
    actor Employee
    participant Browser
    participant GW as Kong API Gateway
    participant AUTH as Auth Service
    participant IDP as Corporate IdP - Azure AD - Okta - SAML
    participant REDIS as Redis

    Employee->>Browser: Navigate to learn.acmecorp.com
    Browser->>GW: GET /auth/login?tenant=acme_corp
    GW->>AUTH: Resolve tenant SSO config
    AUTH-->>Browser: Redirect to corporate IdP
    Employee->>IDP: Authenticate + MFA
    IDP-->>Browser: SAML assertion
    Browser->>GW: POST /auth/saml/{tenant_id}/acs
    GW->>AUTH: Validate SAML assertion
    AUTH->>AUTH: Map IdP attributes to L&D role
    AUTH->>AUTH: Auto-provision user if new
    AUTH->>AUTH: Sign JWT with tenant private key
    AUTH->>REDIS: Store session + refresh token
    AUTH-->>Browser: JWT access token + refresh token
```
