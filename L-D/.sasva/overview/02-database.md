# Database & Data Structure

# Database Architecture — Corporate L&D SaaS Multi-Tenant

## Multi-Tenant Database Strategy

```mermaid
graph TB
    subgraph STARTER["🥉 Starter — Shared Schema, Row-level Isolation"]
        SS_DB[(shared_db)]
        SS_EMP[employees\ntenant_id = 'tenant_acme_corp']
        SS_ATT[training_attendance\ntenant_id = 'tenant_acme_corp']
        SS_DB --> SS_EMP & SS_ATT
    end

    subgraph PRO["🥈 Pro — Shared DB, Schema-per-Tenant"]
        SP_DB[(shared_db)]
        SP_S1[Schema: tenant_acme_corp\nemployees · training_attendance · assessments]
        SP_S2[Schema: tenant_globex_ltd\nemployees · training_attendance · assessments]
        SP_DB --> SP_S1 & SP_S2
    end

    subgraph ENT["🥇 Enterprise — Dedicated DB per Tenant"]
        E_DB1[(tenant_acme_corp_db\nAll tables)]
        E_DB2[(tenant_regulated_co_db\nAll tables)]
    end
```

---

## Entity-Relationship Diagram (Per-Tenant Schema)

```mermaid
erDiagram
    TENANTS {
        varchar tenant_id PK
        varchar organisation_name
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

    TENANTS ||--o{ EMPLOYEES : "has"
    EMPLOYEES ||--o{ TRAINING_ATTENDANCE : "has"
    EMPLOYEES ||--o{ ASSESSMENT_RECORDS : "has"
    EMPLOYEES ||--o{ EMPLOYEE_MILESTONE_PROGRESS : "tracks"
    EMPLOYEES ||--o{ RISK_ASSESSMENTS : "evaluated by"
    EMPLOYEES ||--o{ INTERVENTIONS : "receives"
    COMPETENCY_MILESTONES ||--o{ EMPLOYEE_MILESTONE_PROGRESS : "measured by"
    COMPETENCY_MILESTONES ||--o| COMPETENCY_MILESTONES : "prerequisite of"
    RISK_ASSESSMENTS ||--o{ INTERVENTIONS : "triggers"
    INTERVENTIONS ||--o{ INTERVENTION_OUTCOMES : "measured by"
    RISK_RULES ||--o{ RISK_ASSESSMENTS : "drives"
    TENANTS ||--o{ AUDIT_LOG : "scoped to"
```

---

## Database-per-Service Ownership

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
        I2[raw_training_attendance_staging]
        I3[raw_assessment_staging]
        I4[raw_milestone_staging]
        I5[ingestion_errors]
    end

    subgraph PROF_DB["profile-db\nEmployee Profile Service"]
        P1[employees]
        P2[training_attendance]
        P3[assessment_records]
        P4[competency_milestones]
        P5[employee_milestone_progress]
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
        RE3[ld_reporting_aggregates]
        RE4[compliance_calendars]
    end

    subgraph AUD_DB["audit-db\nAudit Service"]
        AU1[audit_log]
    end
```

---

## Key Table Notes

### `employees`
Central master record. `department` and `business_unit` replace grade/class. `line_manager_id` enables manager notifications. `has_accessibility_needs` flags differentiated learning support.

### `training_attendance`
Records attendance per training session. `session_type` values: `Instructor_Led`, `Virtual`, `Self_Paced`, `Workshop`, `Webinar`. `training_module` links to the relevant competency area.

### `assessment_records`
Stores every scored assessment normalised to a `percentage` column. `competency` and `training_module` columns replace subject/grade-level fields. `rating` values: `Exceeds_Expectations`, `Meets_Expectations`, `Needs_Improvement`, `Unsatisfactory`.

### `competency_milestones`
Defines the corporate competency framework tree. `is_compliance_critical` flags milestones required for regulatory certification. `job_level` and `department` replace grade level.

### `employee_milestone_progress`
Tracks each employee's progress against the competency framework. `proficiency_level` values: `Novice`, `Developing`, `Proficient`, `Expert`.

### `interventions`
`intervention_type` values (per problem statement): `Remedial_Training_Session`, `Coaching_Assignment`, `Mentoring_Assignment`. `assigned_trainer` and `assigned_ld_manager` replace teacher/counsellor.

---

## Tenant Isolation at Query Level

### Starter — Row-level Security
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
CREATE TABLE tenant_acme_corp.training_attendance ( ... );
SET search_path TO tenant_acme_corp;
```

### Enterprise — Dedicated Database
```
Host:     pg-tenant-acme-corp.internal
Database: tenant_acme_corp_db
User:     svc_acme_corp_app
```

---

## Key Indexes

```sql
CREATE INDEX idx_employees_tenant         ON employees                   (tenant_id, employment_status);
CREATE INDEX idx_attendance_tenant        ON training_attendance          (tenant_id, employee_id, session_date);
CREATE INDEX idx_assessments_tenant       ON assessment_records           (tenant_id, employee_id, competency, assessment_date);
CREATE INDEX idx_milestones_tenant        ON competency_milestones        (tenant_id, job_level, department, is_compliance_critical);
CREATE INDEX idx_milestone_progress       ON employee_milestone_progress  (tenant_id, employee_id, status);
CREATE INDEX idx_risk_tenant              ON risk_assessments             (tenant_id, employee_id, risk_level, assessment_date);
CREATE INDEX idx_interventions_tenant     ON interventions                (tenant_id, employee_id, status, intervention_type);
CREATE INDEX idx_rules_tenant             ON risk_rules                   (tenant_id, is_active, severity);
CREATE INDEX idx_audit_tenant             ON audit_log                    (tenant_id, occurred_at DESC);
```

---

## Redis Keyspace Design

| Key Pattern | TTL | Content |
|---|---|---|
| `tenant_ctx:{tenant_id}` | 60 s | Tenant context (db_schema, flags, limits) |
| `profile:{tenant_id}:{employee_id}` | 1 hr | Aggregated employee learning profile snapshot |
| `rules:{tenant_id}:active` | 5 min | Active competency risk rules list |
| `dash:{tenant_id}:{role}:{hash}` | 5 min | L&D dashboard aggregate cache |
| `session:{token_hash}` | JWT expiry | User session data |
| `ratelimit:{tenant_id}:{endpoint}` | 1 min | API rate limit counter |

---

## Data Retention Policy

| Table | Active Retention | Archive After | Purge After |
|---|---|---|---|
| `training_attendance` | Current training year | 3 years | Per org contract |
| `assessment_records` | Current training year | 5 years | Per org contract |
| `employee_milestone_progress` | Employment lifetime | 5 years | Per org contract |
| `risk_assessments` | 2 years | 5 years | Per org contract |
| `interventions` | 2 years | 5 years | Per org contract |
| `intervention_outcomes` | 3 years | 5 years | Per org contract |
| `risk_rules` (versions) | Forever | — | — |
| `audit_log` | 7 years | Cold storage | Per regulation |
| `profile_snapshots` | 3 years | Cold storage | Per org contract |

> **Right-to-erasure (GDPR):** On `tenant.deprovisioned` or employee deletion request, a purge job runs against all service databases, archiving to cold storage and issuing a signed deletion certificate.
