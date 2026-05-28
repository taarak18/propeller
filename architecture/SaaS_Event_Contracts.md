# Microservice Event Contracts
## Corporate L&D Progress, Intervention & Compliance Tracking SaaS — Event Bus Specification

### Document Version: 1.0
### Date: February 2026

---

## 1. Overview

All inter-service communication via the event bus (Kafka / RabbitMQ) follows a **standard envelope format**. Every event carries `tenant_id` to ensure strict tenant isolation. Consumers MUST filter on `tenant_id` before processing any payload.

---

## 2. Standard Event Envelope

Every event published to the bus MUST conform to this envelope:

```json
{
  "event_id":      "string (UUID v4)         — unique event identifier",
  "event_type":    "string                   — dot-namespaced type e.g. risk.detected",
  "event_version": "string                   — schema version e.g. v1",
  "tenant_id":     "string                   — issuing tenant identifier",
  "source_service":"string                   — publishing service name",
  "timestamp":     "string (ISO 8601 UTC)    — event creation time",
  "correlation_id":"string (UUID)            — trace ID for distributed tracing",
  "payload":       "object                   — event-specific data (see below)"
}
```

### Envelope Example

```json
{
  "event_id":       "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_type":     "risk.detected",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "risk-engine-service",
  "timestamp":      "2026-02-04T10:30:00Z",
  "correlation_id": "trace_xyz_9876",
  "payload": { }
}
```

---

## 3. Kafka Topic Naming Convention

```
{tenant_id}.{domain}.{event_type}

Examples:
  tenant_acme_corp.ingestion.data.ingested
  tenant_acme_corp.profile.profile.updated
  tenant_acme_corp.risk.risk.detected
  tenant_acme_corp.intervention.intervention.completed
  tenant_acme_corp.reporting.report.generated
```

> **Enterprise tenants** get dedicated Kafka topics.
> **Shared-tier tenants** share a topic, partitioned by `tenant_id`.

---

## 4. Event Catalogue

### 4.1 Ingestion Service Events

---

#### `data.ingested`
**Published by:** Ingestion Service
**Consumed by:** Employee Profile Service
**Trigger:** A batch of training attendance, assessment score, or competency milestone records has been validated and persisted.

**Kafka Topic:** `{tenant_id}.ingestion.data.ingested`

```json
{
  "event_id":       "uuid",
  "event_type":     "data.ingested",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "ingestion-service",
  "timestamp":      "2026-02-04T08:00:00Z",
  "correlation_id": "uuid",
  "payload": {
    "ingestion_job_id":  "job_20260204_001",
    "data_type":         "training_attendance",
    "record_count":      150,
    "affected_employees": ["EMP_001", "EMP_002", "EMP_003"],
    "period_start":      "2026-02-03",
    "period_end":        "2026-02-04",
    "source_system":     "lms-api-v2",
    "validation_summary": {
      "total_received":  152,
      "total_accepted":  150,
      "total_rejected":  2,
      "rejection_reasons": ["duplicate_record", "invalid_employee_id"]
    }
  }
}
```

**Consumer Contract (Employee Profile Service):**
- MUST re-aggregate learning profiles for all `affected_employees`
- MUST invalidate Redis cache entries for affected employees
- MUST publish `profile.updated` after re-aggregation

---

#### `data.ingestion.failed`
**Published by:** Ingestion Service
**Consumed by:** Audit Service, Notification Service
**Trigger:** A data ingestion job failed validation or encountered a system error.

```json
{
  "event_type": "data.ingestion.failed",
  "event_version": "v1",
  "payload": {
    "ingestion_job_id": "job_20260204_002",
    "data_type":        "competency_assessment",
    "source_system":    "assessment-platform-v1",
    "error_code":       "SCHEMA_VALIDATION_FAILED",
    "error_message":    "Field 'score' exceeds max_score in 3 records",
    "failed_records":   [
      { "record_ref": "ASS_REF_001", "reason": "score > max_score" }
    ],
    "retry_count":      2,
    "requires_manual_review": true
  }
}
```

---

### 4.2 Learner Profile Service Events

---

#### `profile.updated`
**Published by:** Employee Profile Service
**Consumed by:** Risk Engine Service
**Trigger:** An employee's aggregated learning profile has been recalculated.

**Kafka Topic:** `{tenant_id}.profile.profile.updated`

```json
{
  "event_type":     "profile.updated",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "employee-profile-service",
  "payload": {
    "employee_id":    "EMP_001",
    "profile_snapshot": {
      "training_attendance": {
        "last_30_days_pct":    72.5,
        "current_period_pct":  68.0,
        "all_time_pct":        81.3,
        "trend":               "declining"
      },
      "assessments": {
        "overall_average":     58.4,
        "competency_averages": {
          "data_analysis":     52.0,
          "communication":     64.0,
          "technical_skills":  59.2
        },
        "recent_scores":       [55, 48, 62, 51],
        "trend":               "declining",
        "consecutive_failures": 2
      },
      "competency_milestones": {
        "total":               20,
        "completed":           12,
        "in_progress":         3,
        "not_started":         5,
        "overdue":             2,
        "completion_pct":      60.0
      },
      "last_updated":          "2026-02-04T09:15:00Z"
    }
  }
}
```

**Consumer Contract (Risk Engine Service):**
- MUST evaluate all active competency risk rules against the profile snapshot
- MUST NOT call the Employee Profile Service DB directly — use only the snapshot in the event payload
- MUST publish `risk.detected` if any rules are triggered

---

#### `profile.created`
**Published by:** Employee Profile Service
**Consumed by:** Risk Engine Service, Audit Service
**Trigger:** A brand new employee learning profile has been created (new hire onboarding).

```json
{
  "event_type":    "profile.created",
  "event_version": "v1",
  "payload": {
    "employee_id":   "EMP_099",
    "employee_type": "full_time",
    "job_level":     "Mid-Level",
    "department":    "Engineering",
    "onboarded_at":  "2026-02-04",
    "tenant_id":     "tenant_acme_corp"
  }
}
```

---

### 4.3 Risk Engine Service Events

---

#### `risk.detected`
**Published by:** Risk Engine Service
**Consumed by:** Intervention Service, Notification Service, Reporting Service, Audit Service
**Trigger:** One or more competency risk rules fired for an employee; risk level is Medium, High, or Critical.

**Kafka Topic:** `{tenant_id}.risk.risk.detected`

```json
{
  "event_type":     "risk.detected",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "risk-engine-service",
  "payload": {
    "risk_assessment_id":  "RISK_20260204_EMP001",
    "employee_id":         "EMP_001",
    "risk_level":          "HIGH",
    "risk_score":          78.5,
    "previous_risk_level": "MEDIUM",
    "risk_escalated":      true,
    "rules_triggered": [
      {
        "rule_id":       "ATT_001",
        "rule_name":     "Critical Training Attendance Risk",
        "severity":      "HIGH",
        "metric":        "training_attendance_percentage",
        "actual_value":  72.5,
        "threshold":     75.0,
        "contribution":  0.45
      },
      {
        "rule_id":       "SCORE_001",
        "rule_name":     "Two Consecutive Failing Competency Assessments",
        "severity":      "HIGH",
        "metric":        "consecutive_failures",
        "actual_value":  2,
        "threshold":     1,
        "contribution":  0.55
      }
    ],
    "recommended_interventions": [
      "remedial_training_session",
      "coaching_assignment",
      "line_manager_meeting"
    ],
    "alert_targets": ["trainer", "ld_manager", "line_manager"],
    "assessed_at":   "2026-02-04T09:20:00Z"
  }
}
```

**Consumer Contracts:**
- **Intervention Service:** Create a pending remedial training or coaching recommendation record
- **Notification Service:** Send alerts to all `alert_targets` (trainer, L&D manager, line manager)
- **Reporting Service:** Update at-risk employee counts in L&D reporting aggregates
- **Audit Service:** Log the risk detection event immutably

---

#### `risk.resolved`
**Published by:** Risk Engine Service
**Consumed by:** Intervention Service, Notification Service, Reporting Service
**Trigger:** A learner's risk level has dropped to LOW or NONE following improvement.

```json
{
  "event_type":    "risk.resolved",
  "event_version": "v1",
  "payload": {
    "risk_assessment_id":  "RISK_20260204_EMP001",
    "employee_id":         "EMP_001",
    "previous_risk_level": "HIGH",
    "current_risk_level":  "LOW",
    "risk_score":          28.0,
    "resolution_reason":   "training_attendance_and_competency_score_improved",
    "resolved_at":         "2026-03-01T09:00:00Z"
  }
}
```

---

#### `risk.escalated`
**Published by:** Risk Engine Service
**Consumed by:** Notification Service, Audit Service
**Trigger:** Risk level has escalated to CRITICAL — requires immediate human action.

```json
{
  "event_type":    "risk.escalated",
  "event_version": "v1",
  "payload": {
    "risk_assessment_id":  "RISK_20260210_EMP001",
    "employee_id":         "EMP_001",
    "risk_level":          "CRITICAL",
    "risk_score":          92.0,
    "escalation_reason":   "composite_critical_competency_rule_triggered",
    "immediate_actions_required": true,
    "alert_targets":       ["trainer", "ld_manager", "ld_director", "line_manager"],
    "escalated_at":        "2026-02-10T07:45:00Z"
  }
}
```

---

### 4.4 Intervention Service Events

---

#### `intervention.assigned`
**Published by:** Intervention Service
**Consumed by:** Notification Service, Audit Service, Reporting Service
**Trigger:** A remedial training session or coaching assignment has been raised for an employee and is pending L&D Manager approval.

**Kafka Topic:** `{tenant_id}.intervention.intervention.assigned`

```json
{
  "event_type":     "intervention.assigned",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "intervention-service",
  "payload": {
    "intervention_id":    "INT_20260204_001",
    "employee_id":        "EMP_001",
    "risk_assessment_id": "RISK_20260204_EMP001",
    "intervention_type":  "remedial_training_session",
    "description":        "Weekly data analysis remedial training sessions",
    "assigned_by":        "TRAINER_042",
    "assigned_to":        "LD_MANAGER_007",
    "start_date":         "2026-02-10",
    "end_date":           "2026-03-10",
    "frequency":          "weekly",
    "total_sessions":     4,
    "status":             "pending_approval",
    "assigned_at":        "2026-02-04T10:00:00Z"
  }
}
```

---

#### `intervention.approved`
**Published by:** Intervention Service
**Consumed by:** Notification Service, Audit Service
**Trigger:** A counsellor or administrator has approved the intervention.

```json
{
  "event_type":    "intervention.approved",
  "event_version": "v1",
  "payload": {
    "intervention_id": "INT_20260204_001",
    "employee_id":     "EMP_001",
    "approved_by":     "LD_MANAGER_007",
    "approved_at":     "2026-02-05T09:00:00Z",
    "notes":           "Approved — remedial training schedule confirmed with trainer",
    "notify_targets":  ["trainer", "employee", "line_manager"]
  }
}
```

---

#### `intervention.session.logged`
**Published by:** Intervention Service
**Consumed by:** Reporting Service, Audit Service
**Trigger:** A single intervention session has been attended and logged.

```json
{
  "event_type":    "intervention.session.logged",
  "event_version": "v1",
  "payload": {
    "intervention_id":   "INT_20260204_001",
    "employee_id":       "EMP_001",
    "session_number":    2,
    "total_sessions":    4,
    "attended":          true,
    "session_date":      "2026-02-17",
    "facilitator_id":    "TRAINER_042",
    "session_notes":     "Employee engaged well. Showed improvement in data analysis competency.",
    "logged_at":         "2026-02-17T15:30:00Z"
  }
}
```

---

#### `intervention.completed`
**Published by:** Intervention Service
**Consumed by:** Reporting Service, Notification Service, Audit Service, Risk Engine Service
**Trigger:** All sessions of an intervention have been completed.

**Kafka Topic:** `{tenant_id}.intervention.intervention.completed`

```json
{
  "event_type":     "intervention.completed",
  "event_version":  "v1",
  "tenant_id":      "tenant_acme_corp",
  "source_service": "intervention-service",
  "payload": {
    "intervention_id":      "INT_20260204_001",
    "employee_id":          "EMP_001",
    "intervention_type":    "remedial_training_session",
    "start_date":           "2026-02-10",
    "end_date":             "2026-03-10",
    "total_sessions":       4,
    "sessions_attended":    4,
    "attendance_rate":      100.0,
    "outcomes": [
      {
        "metric_type":               "training_attendance_percentage",
        "pre_intervention_value":    72.5,
        "post_intervention_value":   85.0,
        "improvement_percentage":    17.2,
        "statistical_significance":  true
      },
      {
        "metric_type":               "competency_average_score",
        "pre_intervention_value":    58.4,
        "post_intervention_value":   71.2,
        "improvement_percentage":    21.9,
        "statistical_significance":  true
      }
    ],
    "overall_effectiveness": "successful",
    "completed_at":          "2026-03-10T16:00:00Z"
  }
}
```

**Consumer Contracts:**
- **Risk Engine Service:** Re-evaluate employee competency risk profile post-intervention
- **Reporting Service:** Update L&D intervention effectiveness aggregates
- **Notification Service:** Notify trainer, L&D manager, and line manager of completion

---

### 4.5 Reporting Service Events

---

#### `report.generated`
**Published by:** Reporting Service
**Consumed by:** Notification Service, Audit Service
**Trigger:** A compliance or analytics report has been successfully generated.

```json
{
  "event_type":    "report.generated",
  "event_version": "v1",
  "payload": {
    "report_id":      "RPT_20260204_COMP_001",
    "report_type":    "compliance_attendance",
    "report_format":  "PDF",
    "period_start":   "2026-01-01",
    "period_end":     "2026-01-31",
    "generated_by":   "LD_ADMIN_001",
    "storage_url":    "s3://tenant-reports/tenant_acme_corp/RPT_20260204_COMP_001.pdf",
    "file_size_kb":   245,
    "generated_at":   "2026-02-04T11:00:00Z",
    "notify_targets": ["ld_admin", "compliance_officer"]
  }
}
```

---

### 4.6 Tenant Management Service Events

---

#### `tenant.provisioned`
**Published by:** Tenant Management Service
**Consumed by:** Auth Service, All Domain Services, Notification Service
**Trigger:** A new tenant has been onboarded and their environment provisioned.

```json
{
  "event_type":    "tenant.provisioned",
  "event_version": "v1",
  "payload": {
    "tenant_id":        "tenant_globex_ltd_01",
    "tenant_name":      "Globex Ltd",
    "tenant_type":      "corporate",
    "plan":             "pro",
    "isolation_model":  "schema_per_tenant",
    "db_schema":        "tenant_globex_ltd",
    "region":           "us-east-1",
    "admin_user_email": "ld.admin@globex.com",
    "provisioned_at":   "2026-02-04T12:00:00Z"
  }
}
```

---

#### `tenant.plan.upgraded`
**Published by:** Tenant Management Service
**Consumed by:** All Domain Services, Auth Service
**Trigger:** A tenant has upgraded their subscription plan.

```json
{
  "event_type":    "tenant.plan.upgraded",
  "event_version": "v1",
  "payload": {
    "tenant_id":       "tenant_acme_corp",
    "previous_plan":   "starter",
    "new_plan":        "enterprise",
    "effective_date":  "2026-03-01",
    "new_limits": {
      "max_employees":     -1,
      "max_rules":         -1,
      "isolation_model":   "dedicated_db"
    },
    "feature_flags_updated": {
      "ml_risk_scoring":   true,
      "white_label":       true,
      "sso_integration":   true
    }
  }
}
```

---

#### `tenant.deprovisioned`
**Published by:** Tenant Management Service
**Consumed by:** All Domain Services, Auth Service, Audit Service
**Trigger:** A tenant account has been terminated — all services must purge or archive tenant data per retention policy.

```json
{
  "event_type":    "tenant.deprovisioned",
  "event_version": "v1",
  "payload": {
    "tenant_id":          "tenant_old_corp",
    "reason":             "contract_ended",
    "data_action":        "archive",
    "archive_location":   "s3://cold-storage/tenant_old_corp/",
    "purge_after_days":   90,
    "deprovisioned_at":   "2026-02-04T00:00:00Z"
  }
}
```

---

## 5. Event Flow Summary

```
Ingestion Service
  └── publishes → data.ingested
        └── Learner Profile Service consumes
              └── publishes → profile.updated
                    └── Risk Engine Service consumes
                          ├── publishes → risk.detected
                          │     ├── Intervention Service consumes
                          │     │     ├── publishes → intervention.assigned
                          │     │     ├── publishes → intervention.approved
                          │     │     ├── publishes → intervention.session.logged
                          │     │     └── publishes → intervention.completed
                          │     │           └── Risk Engine re-evaluates → risk.resolved?
                          │     ├── Notification Service consumes → sends alerts
                          │     ├── Reporting Service consumes → updates aggregates
                          │     └── Audit Service consumes → logs immutably
                          ├── publishes → risk.escalated
                          │     ├── Notification Service → urgent alerts
                          │     └── Audit Service → logs
                          └── publishes → risk.resolved
                                ├── Notification Service → positive update
                                └── Reporting Service → updates metrics

Tenant Management Service
  ├── publishes → tenant.provisioned → all services initialise tenant context
  ├── publishes → tenant.plan.upgraded → all services update feature gates
  └── publishes → tenant.deprovisioned → all services archive/purge tenant data
```

---

## 6. Dead Letter Queue (DLQ) Strategy

Every consumer MUST implement a DLQ policy:

| Scenario | Behaviour |
|---|---|
| Consumer throws exception | Retry up to **3 times** with exponential back-off (1s, 4s, 16s) |
| All retries exhausted | Route message to `{tenant_id}.dlq.{service_name}` topic |
| DLQ message | Alert on-call engineer + log to Audit Service |
| Manual replay | Admin can replay DLQ messages via Ops API |

---

## 7. Event Schema Versioning

| Rule | Detail |
|---|---|
| `event_version` field | Always present in envelope — consumers check before processing |
| Backward compatible changes | Add optional fields only — no removing or renaming fields |
| Breaking changes | Bump version (`v1` → `v2`) — run both versions in parallel during migration |
| Deprecation window | Old version supported for minimum **90 days** after new version released |
| Schema registry | All schemas registered in Confluent Schema Registry / AWS Glue |
