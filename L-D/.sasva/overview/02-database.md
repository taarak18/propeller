# Database & Data Structure

# Database Architecture — SaaS Multi-Tenant

## Multi-Tenant Database Strategy

```mermaid
graph TB
    subgraph STARTER["🥉 Starter — Shared Schema, Row-level Isolation"]
        SS_DB[(shared_db)]
        SS_STU[students\ntenant_id = 'tenant_a']
        SS_ATT[attendance_records\ntenant_id = 'tenant_a']
        SS_DB --> SS_STU & SS_ATT
    end

    subgraph PRO["🥈 Pro — Shared DB, Schema-per-Tenant"]
        SP_DB[(shared_db)]
        SP_S1[Schema: tenant_springfield_hs\nstudents · attendance · assessments]
        SP_S2[Schema: tenant_riverdale_ac\nstudents · attendance · assessments]
        SP_DB --> SP_S1 & SP_S2
    end

    subgraph ENT["🥇 Enterprise — Dedicated DB per Tenant"]
        E_DB1[(tenant_acme_corp_db\nAll tables)]
        E_DB2[(tenant_district_01_db\nAll tables)]
    end
```

---

## Entity-Relationship Diagram (Per-Tenant Schema)

```mermaid
erDiagram
    TENANTS {
        varchar tenant_id PK
        varchar tenant_name
        varchar tenant_type
        varchar plan
        varchar status
        varchar isolation_model
        varchar db_schema
        varchar region
        jsonb   feature_flags
        jsonb   subscription
        jsonb   branding
        timestamp created_at
        timestamp updated_at
    }

    LEARNERS {
        varchar  learner_id PK
        varchar  tenant_id
        varchar  first_name
        varchar  last_name
        date     date_of_birth
        varchar  grade_or_level
        varchar  department
        varchar  section
        date     enrollment_date
        varchar  learner_type
        varchar  status
        boolean  special_needs
        varchar  contact_email
        varchar  contact_phone
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCE_RECORDS {
        bigserial attendance_id PK
        varchar   tenant_id
        varchar   learner_id FK
        date      attendance_date
        varchar   period
        varchar   status
        text      reason
        varchar   recorded_by
        timestamp recorded_at
    }

    ASSESSMENT_RECORDS {
        bigserial assessment_id PK
        varchar   tenant_id
        varchar   learner_id FK
        varchar   subject
        varchar   assessment_type
        varchar   assessment_name
        decimal   score
        decimal   max_score
        decimal   percentage
        varchar   grade
        date      assessment_date
        varchar   facilitator_id
        text      comments
        timestamp created_at
    }

    CURRICULUM_MILESTONES {
        bigserial milestone_id PK
        varchar   tenant_id
        varchar   grade_or_level
        varchar   subject
        varchar   milestone_name
        text      milestone_description
        varchar   expected_completion_period
        bigint    prerequisite_milestone_id FK
        timestamp created_at
    }

    LEARNER_MILESTONE_PROGRESS {
        bigserial progress_id PK
        varchar   tenant_id
        varchar   learner_id FK
        bigint    milestone_id FK
        varchar   status
        date      completion_date
        varchar   proficiency_level
        text      facilitator_notes
        timestamp updated_at
    }

    RISK_ASSESSMENTS {
        bigserial risk_id PK
        varchar   tenant_id
        varchar   learner_id FK
        date      assessment_date
        varchar   risk_level
        decimal   risk_score
        jsonb     risk_factors
        jsonb     rules_triggered
        jsonb     recommended_interventions
        varchar   status
        varchar   assigned_to
        timestamp created_at
        timestamp updated_at
    }

    RISK_RULES {
        varchar   rule_id PK
        varchar   tenant_id
        varchar   rule_name
        text      description
        varchar   severity
        jsonb     rule_definition
        boolean   is_active
        varchar   applicable_grades
        varchar   applicable_subjects
        int       version
        varchar   created_by
        timestamp created_at
        timestamp updated_at
    }

    INTERVENTIONS {
        bigserial intervention_id PK
        varchar   tenant_id
        varchar   learner_id FK
        bigint    risk_id FK
        varchar   intervention_type
        text      description
        date      start_date
        date      end_date
        varchar   frequency
        varchar   assigned_facilitator
        varchar   assigned_counselor
        varchar   status
        int       attendance_count
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
        timestamp occurred_at
    }

    TENANTS ||--o{ LEARNERS : "has"
    LEARNERS ||--o{ ATTENDANCE_RECORDS : "has"
    LEARNERS ||--o{ ASSESSMENT_RECORDS : "has"
    LEARNERS ||--o{ LEARNER_MILESTONE_PROGRESS : "tracks"
    LEARNERS ||--o{ RISK_ASSESSMENTS : "evaluated by"
    LEARNERS ||--o{ INTERVENTIONS : "receives"
    CURRICULUM_MILESTONES ||--o{ LEARNER_MILESTONE_PROGRESS : "measured by"
    CURRICULUM_MILESTONES ||--o| CURRICULUM_MILESTONES : "prerequisite of"
    RISK_ASSESSMENTS ||--o{ INTERVENTIONS : "triggers"
    INTERVENTIONS ||--o{ INTERVENTION_OUTCOMES : "measured by"
    RISK_RULES ||--o{ RISK_ASSESSMENTS : "drives"
    TENANTS ||--o{ AUDIT_LOG : "scoped to"
```

---

## Database-per-Service Ownership

Each microservice owns its own database. No service ever queries another service's database directly.

```mermaid
graph LR
    subgraph TMS_DB["tenant-db\nTenant Management Service"]
        T1[tenants]
        T2[tenant_plans]
        T3[tenant_feature_flags]
        T4[tenant_usage_metrics]
        T5[tenant_billing_events]
    end

    subgraph AUTH_DB["auth-db\nAuth / Identity Service"]
        A1[users]
        A2[user_roles]
        A3[sessions]
        A4[sso_configurations]
        A5[refresh_tokens]
    end

    subgraph ING_DB["ingestion-db\nIngestion Service"]
        I1[ingestion_jobs]
        I2[raw_attendance_staging]
        I3[raw_assessment_staging]
        I4[ingestion_errors]
    end

    subgraph PROF_DB["profile-db\nLearner Profile Service"]
        P1[learners]
        P2[attendance_records]
        P3[assessment_records]
        P4[curriculum_milestones]
        P5[learner_milestone_progress]
        P6[profile_snapshots]
    end

    subgraph RISK_DB["risk-db\nRisk Engine Service"]
        R1[risk_assessments]
    end

    subgraph RULE_DB["rules-db\nRule Management Service"]
        RU1[risk_rules]
        RU2[risk_rule_versions]
        RU3[rule_test_runs]
    end

    subgraph INT_DB["intervention-db\nIntervention Service"]
        N1[interventions]
        N2[intervention_sessions]
        N3[intervention_outcomes]
    end

    subgraph RPT_DB["reporting-db\nReporting Service"]
        RE1[report_templates]
        RE2[generated_reports]
        RE3[reporting_aggregates]
        RE4[compliance_calendars]
    end

    subgraph AUD_DB["audit-db\nAudit Service"]
        AU1[audit_log]
    end
```

---

## Tenant Isolation at Query Level

### Starter Plan — Row-level Policy (PostgreSQL Row Security)

```sql
-- Enable Row Level Security on every shared table
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Policy: each service can only see rows matching its tenant JWT claim
CREATE POLICY tenant_isolation ON learners
    USING (tenant_id = current_setting('app.current_tenant_id'));

-- Set tenant context at connection time
SET app.current_tenant_id = 'tenant_springfield_hs_a1b2';
```

### Pro Plan — Schema-per-Tenant

```sql
-- Each tenant gets their own schema
CREATE SCHEMA tenant_springfield_hs_a1b2;

-- All tables created inside tenant schema
CREATE TABLE tenant_springfield_hs_a1b2.learners ( ... );
CREATE TABLE tenant_springfield_hs_a1b2.attendance_records ( ... );

-- Service sets search_path on connection
SET search_path TO tenant_springfield_hs_a1b2;
```

### Enterprise Plan — Dedicated Database

```
Host:     pg-tenant-acme-corp.internal
Database: tenant_acme_corp_db
User:     svc_acme_corp_app
Schema:   public
```

---

## Key Schema Additions for Multi-Tenancy

### `tenant_id` on All Domain Tables

Every table in the domain schema carries `tenant_id` as the **first non-PK column** and is indexed:

```sql
-- Composite index: tenant_id + most common filter column
CREATE INDEX idx_learners_tenant       ON learners           (tenant_id, status);
CREATE INDEX idx_attendance_tenant     ON attendance_records  (tenant_id, learner_id, attendance_date);
CREATE INDEX idx_assessments_tenant    ON assessment_records  (tenant_id, learner_id, assessment_date);
CREATE INDEX idx_risk_tenant           ON risk_assessments    (tenant_id, learner_id, risk_level, assessment_date);
CREATE INDEX idx_interventions_tenant  ON interventions       (tenant_id, learner_id, status);
CREATE INDEX idx_rules_tenant          ON risk_rules          (tenant_id, is_active, severity);
CREATE INDEX idx_audit_tenant          ON audit_log           (tenant_id, occurred_at DESC);
```

---

### `risk_rule_versions` — Rule Versioning Table

```sql
CREATE TABLE risk_rule_versions (
    version_id      BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(100) NOT NULL,
    rule_id         VARCHAR(50)  NOT NULL,
    version         INT          NOT NULL,
    rule_definition JSONB        NOT NULL,
    change_summary  TEXT,
    changed_by      VARCHAR(100),
    changed_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, rule_id, version)
);
```

### `profile_snapshots` — Historical Profile Storage

```sql
CREATE TABLE profile_snapshots (
    snapshot_id   BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(100) NOT NULL,
    learner_id    VARCHAR(50)  NOT NULL,
    snapshot_date DATE         NOT NULL,
    profile_data  JSONB        NOT NULL,  -- full profile at point in time
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, learner_id, snapshot_date)
);
```

### `tenant_usage_metrics` — Metered Billing Data

```sql
CREATE TABLE tenant_usage_metrics (
    metric_id     BIGSERIAL PRIMARY KEY,
    tenant_id     VARCHAR(100) NOT NULL,
    metric_date   DATE         NOT NULL,
    learner_count INT          NOT NULL DEFAULT 0,
    api_calls     BIGINT       NOT NULL DEFAULT 0,
    storage_gb    DECIMAL(10,4)NOT NULL DEFAULT 0,
    reports_generated INT      NOT NULL DEFAULT 0,
    recorded_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, metric_date)
);
```

---

## Redis Keyspace Design (Multi-Tenant)

| Key Pattern | TTL | Content |
|---|---|---|
| `tenant_ctx:{tenant_id}` | 60 s | Tenant context (db_schema, flags, limits) |
| `profile:{tenant_id}:{learner_id}` | 1 hr | Aggregated learner profile snapshot |
| `rules:{tenant_id}:active` | 5 min | Active risk rules list |
| `dash:{tenant_id}:{role}:{hash}` | 5 min | Dashboard aggregate cache |
| `session:{token_hash}` | JWT expiry | User session data |
| `ratelimit:{tenant_id}:{endpoint}` | 1 min | API rate limit counter |

---

## Data Retention Policy (Per Tenant)

| Table | Active Retention | Archive After | Purge After |
|---|---|---|---|
| `attendance_records` | Current year | 3 years | Per tenant contract |
| `assessment_records` | Current year | 5 years | Per tenant contract |
| `learner_milestone_progress` | Enrolment lifetime | 5 years | Per tenant contract |
| `risk_assessments` | 2 years | 5 years | Per tenant contract |
| `interventions` | 2 years | 5 years | Per tenant contract |
| `intervention_outcomes` | 3 years | 5 years | Per tenant contract |
| `risk_rules` (versions) | Forever | — | — |
| `audit_log` | 7 years | Cold storage | Per regulation |
| `profile_snapshots` | 3 years | Cold storage | Per tenant contract |

> **Right-to-erasure:** On `tenant.deprovisioned` event, a data purge job runs against all service databases, archiving to cold storage and issuing a signed deletion certificate.
