# Database & Data Structure

## Corporate L&D SaaS — Multi-Tenant (Production-Ready v2.0)

> **Changes from v1.0:** Corrected data ownership — `training_attendance`, `assessment_records`, `competency_milestones` moved from `ingestion-db` to `profile-db` (curated read model). Added `consent-db` and consent tables. Added `PII_CLASSIFICATION` column annotations. Added erasure tracking tables. Updated `RISK_REVIEWS` table for human-review gate. Added `DATA_ERASURE_REQUESTS` table. Added future-scope OLAP section.

---

## Multi-Tenant Database Strategy

```mermaid
graph TB
    subgraph STARTER["Starter — Shared Schema, Row-level Security"]
        SS_DB[(shared_db)]
        SS_EMP[employees - tenant_id = acme_corp]
        SS_ATT[training_attendance - tenant_id = acme_corp]
        SS_DB --> SS_EMP & SS_ATT
    end

    subgraph PRO["Pro — Shared DB, Schema-per-Tenant"]
        SP_DB[(shared_db)]
        SP_S1[Schema: tenant_acme_corp]
        SP_S2[Schema: tenant_globex_ltd]
        SP_DB --> SP_S1 & SP_S2
    end

    subgraph ENT["Enterprise — Dedicated DB per Tenant"]
        E_DB1[(tenant_acme_corp_db)]
        E_DB2[(tenant_regulated_co_db)]
    end
```

---

## Data Classification Policy

All columns containing personal data are annotated below with their classification level. This drives encryption choices, retention, and erasure scope.

| Classification | Examples | Controls |
|---|---|---|
| `PII_STANDARD` | Name, email, phone, job title | AES-256 at rest; column-level encryption for email/phone |
| `PII_SENSITIVE` | Assessment scores linked to competency gaps, risk classifications | Envelope encryption (Vault DEK + AWS KMS); pseudonymised in reports |
| `PII_IDENTIFIER` | employee_id (internal), work_email | Hashed in analytics aggregates |
| `INTERNAL` | Department, business unit, training module | Standard encryption at rest |
| `SYSTEM` | IDs, timestamps, status codes | Standard encryption at rest |

---

## Entity-Relationship Diagram (Per-Tenant Schema)

```mermaid
erDiagram
    TENANTS {
        varchar tenant_id PK
        varchar organisation_name
        varchar plan
        varchar status
        varchar isolation_model
        varchar db_schema
        varchar region
        varchar data_region
        jsonb   feature_flags
        jsonb   subscription
        jsonb   branding
        timestamp created_at
        timestamp updated_at
    }

    EMPLOYEES {
        varchar   employee_id PK
        varchar   tenant_id
        varchar   first_name
        varchar   last_name
        date      date_of_birth
        varchar   job_title
        varchar   department
        varchar   business_unit
        varchar   line_manager_id
        date      onboarding_date
        varchar   employment_status
        boolean   has_accessibility_needs
        varchar   work_email
        varchar   work_phone
        boolean   risk_profiling_opt_out
        varchar   erasure_status
        timestamp erasure_requested_at
        timestamp created_at
        timestamp updated_at
    }

    TRAINING_ATTENDANCE {
        bigserial attendance_id PK
        varchar   tenant_id
        varchar   employee_id FK
        date      session_date
        varchar   session_type
        varchar   training_module
        varchar   status
        text      reason
        varchar   recorded_by
        varchar   ingestion_job_id
        timestamp recorded_at
    }

    ASSESSMENT_RECORDS {
        bigserial assessment_id PK
        varchar   tenant_id
        varchar   employee_id FK
        varchar   competency
        varchar   training_module
        varchar   assessment_type
        varchar   assessment_name
        decimal   score
        decimal   max_score
        decimal   percentage
        varchar   rating
        date      assessment_date
        varchar   assessor_id
        text      feedback
        varchar   ingestion_job_id
        timestamp created_at
    }

    COMPETENCY_MILESTONES {
        bigserial milestone_id PK
        varchar   tenant_id
        varchar   job_level
        varchar   department
        varchar   competency
        varchar   milestone_name
        text      milestone_description
        varchar   expected_completion_period
        bigint    prerequisite_milestone_id FK
        boolean   is_compliance_critical
        timestamp created_at
    }

    EMPLOYEE_MILESTONE_PROGRESS {
        bigserial progress_id PK
        varchar   tenant_id
        varchar   employee_id FK
        bigint    milestone_id FK
        varchar   status
        date      completion_date
        varchar   proficiency_level
        text      trainer_notes
        timestamp updated_at
    }

    RISK_ASSESSMENTS {
        bigserial risk_id PK
        varchar   tenant_id
        varchar   employee_id FK
        date      assessment_date
        varchar   risk_level
        decimal   risk_score
        jsonb     risk_factors
        jsonb     rules_triggered
        jsonb     recommended_interventions
        varchar   status
        varchar   assigned_to
        boolean   requires_human_review
        timestamp created_at
        timestamp updated_at
    }

    RISK_REVIEWS {
        bigserial review_id PK
        varchar   tenant_id
        bigint    risk_id FK
        varchar   reviewer_id
        varchar   reviewer_role
        varchar   decision
        text      notes
        timestamp reviewed_at
    }

    RISK_RULES {
        varchar   rule_id PK
        varchar   tenant_id
        varchar   rule_name
        text      description
        varchar   severity
        jsonb     rule_definition
        boolean   is_active
        varchar   applicable_departments
        varchar   applicable_competencies
        int       version
        varchar   created_by
        timestamp created_at
        timestamp updated_at
    }

    INTERVENTIONS {
        bigserial intervention_id PK
        varchar   tenant_id
        varchar   employee_id FK
        bigint    risk_id FK
        varchar   intervention_type
        text      description
        date      start_date
        date      end_date
        varchar   frequency
        varchar   assigned_trainer
        varchar   assigned_ld_manager
        varchar   status
        varchar   temporal_workflow_id
        int       sessions_attended
        int       total_sessions
        decimal   cost
        timestamp created_at
        timestamp updated_at
    }

    INTERVENTION_OUTCOMES {
        bigserial outcome_id PK
        varchar   tenant_id
        bigint    intervention_id FK
        varchar   metric_type
        decimal   pre_intervention_value
        decimal   post_intervention_value
        decimal   improvement_percentage
        boolean   statistical_significance
        text      notes
        timestamp evaluated_at
    }

    CONSENTS {
        bigserial consent_id PK
        varchar   tenant_id
        varchar   employee_id FK
        varchar   purpose
        varchar   status
        varchar   legal_basis
        varchar   collected_by
        varchar   jurisdiction
        text      disclosure_text_snapshot
        timestamp consented_at
        timestamp withdrawn_at
        timestamp expires_at
    }

    DATA_ERASURE_REQUESTS {
        bigserial erasure_id PK
        varchar   tenant_id
        varchar   employee_id FK
        varchar   requested_by
        varchar   request_type
        varchar   status
        varchar   temporal_workflow_id
        jsonb     services_pending
        jsonb     services_completed
        text      deletion_certificate_s3_key
        timestamp requested_at
        timestamp completed_at
    }

    AUDIT_LOG {
        bigserial audit_id PK
        varchar   tenant_id
        varchar   event_type
        varchar   actor_id
        varchar   actor_role
        varchar   resource_type
        varchar   resource_id
        jsonb     before_state
        jsonb     after_state
        varchar   ip_address
        varchar   chain_hash
        varchar   prev_chain_hash
        timestamp occurred_at
    }

    TENANTS ||--o{ EMPLOYEES : "has"
    EMPLOYEES ||--o{ TRAINING_ATTENDANCE : "has"
    EMPLOYEES ||--o{ ASSESSMENT_RECORDS : "has"
    EMPLOYEES ||--o{ EMPLOYEE_MILESTONE_PROGRESS : "tracks"
    EMPLOYEES ||--o{ RISK_ASSESSMENTS : "evaluated by"
    EMPLOYEES ||--o{ INTERVENTIONS : "receives"
    EMPLOYEES ||--o{ CONSENTS : "gives"
    EMPLOYEES ||--o{ DATA_ERASURE_REQUESTS : "may request"
    COMPETENCY_MILESTONES ||--o{ EMPLOYEE_MILESTONE_PROGRESS : "measured by"
    COMPETENCY_MILESTONES ||--o| COMPETENCY_MILESTONES : "prerequisite of"
    RISK_ASSESSMENTS ||--o{ INTERVENTIONS : "triggers"
    RISK_ASSESSMENTS ||--o{ RISK_REVIEWS : "reviewed by"
    INTERVENTIONS ||--o{ INTERVENTION_OUTCOMES : "measured by"
    RISK_RULES ||--o{ RISK_ASSESSMENTS : "drives"
    TENANTS ||--o{ AUDIT_LOG : "scoped to"
```

---

## Database-per-Service Ownership

```mermaid
graph LR
    subgraph TMS_DB["tenant-db"]
        T1[tenants]
        T2[tenant_plans]
        T3[tenant_feature_flags]
        T4[tenant_usage_metrics]
        T5[tenant_billing_events]
    end

    subgraph AUTH_DB["auth-db"]
        A1[users]
        A2[user_roles]
        A3[sessions]
        A4[sso_configurations]
        A5[refresh_tokens]
        A6[jwks_keys]
    end

    subgraph ING_DB["ingestion-db RAW STAGING ONLY"]
        I1[ingestion_jobs]
        I2[raw_training_attendance_staging]
        I3[raw_assessment_staging]
        I4[raw_milestone_staging]
        I5[ingestion_errors]
        I6[ingestion_outbox]
    end

    subgraph PROF_DB["profile-db CURATED READ MODEL"]
        P1[employees]
        P2[training_attendance]
        P3[assessment_records]
        P4[competency_milestones]
        P5[employee_milestone_progress]
        P6[profile_snapshots]
        P7[profile_outbox]
    end

    subgraph RISK_DB["risk-db"]
        R1[risk_assessments]
        R2[risk_reviews]
        R3[risk_outbox]
    end

    subgraph RULE_DB["rules-db"]
        RU1[risk_rules]
        RU2[risk_rule_versions]
        RU3[rule_test_runs]
    end

    subgraph INT_DB["intervention-db"]
        N1[interventions]
        N2[intervention_sessions]
        N3[intervention_outcomes]
        N4[intervention_outbox]
    end

    subgraph RPT_DB["reporting-db CDC READ MODEL"]
        RE1[report_templates]
        RE2[generated_reports]
        RE3[ld_reporting_aggregates]
        RE4[compliance_calendars]
        RE5[at_risk_snapshots]
    end

    subgraph CONSENT_DB["consent-db"]
        CO1[consents]
        CO2[consent_audit]
        CO3[erasure_requests]
        CO4[data_export_requests]
        CO5[consent_outbox]
    end

    subgraph AUD_DB["audit-db"]
        AU1[audit_log]
        AU2[audit_chain_checkpoints]
    end
```

---

## Key Table Notes

### `employees` (profile-db)
Central master record per tenant. `risk_profiling_opt_out` flag supports CCPA/CPRA automated-profiling opt-out. `erasure_status` tracks erasure request lifecycle (`NONE` / `PENDING` / `IN_PROGRESS` / `COMPLETED`).

### `training_attendance` (profile-db)
Curated from `data.ingested` events. `ingestion_job_id` preserves lineage to the source ingestion batch.

### `assessment_records` (profile-db)
Stores every scored assessment normalised to a `percentage` column. `rating` values: `Exceeds_Expectations`, `Meets_Expectations`, `Needs_Improvement`, `Unsatisfactory`.

### `risk_assessments` (risk-db)
`requires_human_review = TRUE` is set for all `CRITICAL` and `HIGH` risk assessments. A corresponding `RISK_REVIEWS` row must be created before the notification is dispatched to satisfy GDPR Article 22 / CCPA automated-profiling obligations.

### `risk_reviews` (risk-db)
Records the human-review decision: `CONFIRMED` (agreed with automated classification), `OVERRIDDEN` (changed risk level), `DISMISSED` (false positive). Stored in audit trail for regulatory evidence.

### `interventions` (intervention-db)
`temporal_workflow_id` links to the running Temporal workflow instance for intervention lifecycle. Enables workflow inspection, resume, and cancellation via Temporal Web UI or API.

### `consents` (consent-db)
One row per employee-purpose pair. `purpose` values: `risk_profiling`, `anonymised_benchmarking`, `ml_scoring`, `trainer_notes`, `third_party_sharing`. `legal_basis` values: `consent`, `legitimate_interest`, `contract`, `legal_obligation`. `jurisdiction` drives which regulations apply.

### `data_erasure_requests` (consent-db)
Tracks a cross-service erasure saga. `services_pending` / `services_completed` are JSON arrays listing each service that must confirm PII deletion. `deletion_certificate_s3_key` is set when all services confirm and a signed certificate is uploaded to S3 (Object Lock).

### `audit_log` (audit-db)
`chain_hash = SHA-256(event_type + resource_id + occurred_at + before_state + after_state + prev_chain_hash)`. `audit_chain_checkpoints` stores periodic signed snapshots exported to S3 Object Lock for WORM compliance.

---

## Tenant Isolation at Query Level

### Starter — Row-Level Security (PostgreSQL RLS)
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employees
    USING (tenant_id = current_setting('app.current_tenant_id'));

SET app.current_tenant_id = 'tenant_acme_corp';
```

### Pro — Schema-per-Tenant
```sql
CREATE SCHEMA tenant_acme_corp;
CREATE TABLE tenant_acme_corp.employees ( ... );
SET search_path TO tenant_acme_corp;
```

### Enterprise — Dedicated Database
```
Host:     pg-tenant-acme-corp.internal (RDS instance or self-managed)
Database: tenant_acme_corp_db
User:     svc_acme_corp_app
Vault:    transit/encrypt/tenant-acme-corp  (per-tenant DEK)
```

---

## Key Indexes

```sql
-- profile-db
CREATE INDEX idx_employees_tenant            ON employees                   (tenant_id, employment_status, erasure_status);
CREATE INDEX idx_attendance_tenant           ON training_attendance          (tenant_id, employee_id, session_date);
CREATE INDEX idx_assessments_tenant          ON assessment_records           (tenant_id, employee_id, competency, assessment_date);
CREATE INDEX idx_milestones_tenant           ON competency_milestones        (tenant_id, job_level, department, is_compliance_critical);
CREATE INDEX idx_milestone_progress          ON employee_milestone_progress  (tenant_id, employee_id, status);

-- risk-db
CREATE INDEX idx_risk_tenant                 ON risk_assessments             (tenant_id, employee_id, risk_level, assessment_date);
CREATE INDEX idx_risk_review                 ON risk_reviews                 (tenant_id, risk_id, decision);

-- intervention-db
CREATE INDEX idx_interventions_tenant        ON interventions                (tenant_id, employee_id, status);

-- rules-db
CREATE INDEX idx_rules_tenant                ON risk_rules                   (tenant_id, is_active, severity);

-- consent-db
CREATE INDEX idx_consents_employee           ON consents                     (tenant_id, employee_id, purpose, status);
CREATE INDEX idx_erasure_status              ON data_erasure_requests        (tenant_id, status, requested_at);

-- audit-db
CREATE INDEX idx_audit_tenant                ON audit_log                    (tenant_id, occurred_at DESC);
CREATE UNIQUE INDEX idx_audit_chain          ON audit_log                    (tenant_id, audit_id);

-- ingestion-db
CREATE UNIQUE INDEX idx_ingest_idempotency   ON ingestion_jobs               (tenant_id, idempotency_key);
```

---

## Redis Keyspace Design

| Key Pattern | TTL | Content |
|---|---|---|
| `tenant_ctx:{tenant_id}` | 60 s | Tenant context (db_schema, flags, limits, data_region) |
| `profile:{tenant_id}:{employee_id}` | 1 hr | Aggregated employee learning profile snapshot |
| `rules:{tenant_id}:active` | 5 min | Active competency risk rules list |
| `dash:{tenant_id}:{role}:{hash}` | 5 min | L&D dashboard aggregate cache |
| `session:{token_hash}` | JWT expiry | User session data |
| `ratelimit:{tenant_id}:{endpoint}` | 1 min | API rate limit counter |
| `jwks:{tenant_id}` | 5 min | Cached JWKS public keys per tenant |
| `consent:{tenant_id}:{employee_id}` | 15 min | Active consent flags for hot-path checks |

---

## Data Retention Policy

| Table | Active Retention | Archive After | Purge After | Regulations |
|---|---|---|---|---|
| `training_attendance` | Current training year | 3 years | Per org contract | GDPR, DPDP |
| `assessment_records` | Current training year | 5 years | Per org contract | GDPR, DPDP |
| `employee_milestone_progress` | Employment lifetime | 5 years | Per org contract | GDPR, DPDP |
| `risk_assessments` | 2 years | 5 years | Per org contract | GDPR Art.22, CCPA |
| `risk_reviews` | 2 years | 5 years | Per org contract | GDPR Art.22, CCPA |
| `interventions` | 2 years | 5 years | Per org contract | GDPR, DPDP |
| `intervention_outcomes` | 3 years | 5 years | Per org contract | GDPR |
| `consents` | Until withdrawn + 1 year | 5 years | Per org contract | GDPR, DPDP, CCPA, PIPEDA |
| `data_erasure_requests` | Permanent (audit) | — | Never | GDPR, DPDP |
| `risk_rules` (versions) | Forever | — | — | Audit |
| `audit_log` | 7 years | Cold storage (S3 Object Lock) | Per regulation | SOC 2, GDPR |
| `profile_snapshots` | 3 years | Cold storage | Per org contract | GDPR |

**Right-to-erasure scope (GDPR / DPDP / CCPA):** On erasure request, a Temporal-orchestrated erasure saga runs across all services. PII fields are overwritten with anonymised tokens; linkage keys are destroyed. The `audit_log` retains pseudonymised event records for the legally required period (regulatory evidence).

---

## Outbox Tables (Per-Service)

Each service that publishes events has an `{service}_outbox` table:

```sql
CREATE TABLE profile_outbox (
    outbox_id     BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR NOT NULL,
    aggregate_id  VARCHAR NOT NULL,
    event_type    VARCHAR NOT NULL,
    payload       BYTEA   NOT NULL,  -- Protobuf-serialised
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    published_at  TIMESTAMP,
    CONSTRAINT uq_outbox_event UNIQUE (aggregate_id, event_type, created_at)
);
CREATE INDEX idx_outbox_unpublished ON profile_outbox (published_at) WHERE published_at IS NULL;
```

Debezium reads the outbox table using the **Outbox Event Router** transformation and publishes to the corresponding Kafka topic. `published_at` is set by the CDC sink after successful publish.

---

## OLAP / Analytics — Future Scope

> **MVP decision:** PostgreSQL materialised views are sufficient for Phase 1–5 reporting. OLAP is a P2 item.

**Materialised views (MVP):**
```sql
CREATE MATERIALIZED VIEW mv_tenant_risk_summary AS
SELECT
    tenant_id,
    DATE_TRUNC('day', assessment_date) AS day,
    COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') AS critical_count,
    COUNT(*) FILTER (WHERE risk_level = 'HIGH')     AS high_count,
    COUNT(*) FILTER (WHERE risk_level = 'MEDIUM')   AS medium_count,
    COUNT(*) FILTER (WHERE risk_level = 'LOW')      AS low_count,
    COUNT(*) FILTER (WHERE status = 'RESOLVED')     AS resolved_count
FROM risk_assessments
GROUP BY tenant_id, DATE_TRUNC('day', assessment_date);

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_risk_summary;
```

**P2 analytics pipeline (when cross-tenant benchmarks and ML scoring are required):**

```mermaid
flowchart LR
    A[(profile-db)] -->|Debezium CDC| K1[Kafka: cdc.profile]
    B[(risk-db)] -->|Debezium CDC| K2[Kafka: cdc.risk]
    C[(intervention-db)] -->|Debezium CDC| K3[Kafka: cdc.intervention]
    K1 & K2 & K3 --> SINK[ClickHouse Kafka Connector\nor Snowflake Kafka Connector]
    SINK --> OLAP[(ClickHouse or Snowflake\nAnalytics warehouse)]
    OLAP --> BI[Metabase or Looker\nL&D Benchmarks]
    OLAP --> ML[ML Feature Store\nFeast - Risk scoring]
```

Target OLAP: **ClickHouse** (self-hosted on K8s, low cost) for teams with ops capacity; **Snowflake** (managed) for teams prioritising zero ops. Decision deferred to P2 based on customer demand and team capacity.
