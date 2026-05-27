# Corporate Learning System — Rules Engine Decision & Risk Rule Catalog

**Document purpose:** Record the rules-engine approach, compare alternatives, and define a catalog of sample **custom JSON DSL** rules for corporate learning risk scenarios aligned with Problem Statement 3.

**Decision:** **Option 1 — Custom JSON DSL** (rules stored as JSON/YAML, evaluated by application code).

**Reference sample:** Adapted from `Corporate_Learning_System_Implementation_Guide.md` §2.1.3 (Risk Rule Definition Format).

---

## 1. Rules engine decision

### 1.1 Why not a heavy BRMS (e.g. Drools)?

For this problem statement the engine must support:

- Configurable thresholds (attendance %, scores)
- At-risk learner classification
- Intervention triggers (remedial training, coaching/mentoring)
- Clean separation of **data**, **rules**, and **reporting**

Typical rule volume is modest (on the order of 15–50 rules), mostly boolean/threshold logic. A full Business Rule Management System adds operational weight (KIE runtime, DRL expertise, Rete complexity) without proportional benefit for a technothon/MVP.

### 1.2 Selected approach: Custom JSON DSL

| Aspect | Approach |
|--------|----------|
| Storage | JSON (or YAML) in DB, versioned per tenant |
| Execution | Application loads active rules → evaluates against **employee learning profile** snapshot |
| Configuration | L&D admin UI reads/writes same JSON schema |
| Extensions | Optional expression engine (SpEL/Aviator) only for edge cases later |

**Benefits:** Minimal dependencies, full control, easy audit, matches evaluation criterion “clean separation of data, rules, and reporting.”

---

## 2. Alternatives considered (comparison)

| Approach | Weight | Configurable by L&D | Composite / trend rules | Best fit for PS3 |
|----------|--------|---------------------|-------------------------|------------------|
| **Custom JSON DSL** ✅ | Low | Yes (with UI) | Yes (AND/OR trees) | **Primary choice** |
| Expression engine (SpEL, Aviator, JEXL) | Low–Med | Partial (strings) | Yes | Optional for complex formulas |
| Easy Rules / json-rules-engine | Med | Partial | Yes | Alternative if team wants library |
| DMN decision tables | Med | Yes (tables) | Yes | Good if UI is table-only |
| Drools / full BRMS | High | With tooling | Excellent | Overkill for MVP |
| DB-only rules (no DSL file) | Low | Yes | Limited | Good for simplest thresholds only |

**Related (not the risk engine itself):** Workflow tools (Camunda, Temporal) orchestrate **intervention steps**; OPA handles **authorization policy** — use alongside, not instead of, risk rules.

---

## 3. JSON rule schema (corporate learning)

### 3.1 Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `ruleId` | Yes | Unique identifier (e.g. `RISK_CORP_001`) |
| `ruleName` | Yes | Display name |
| `description` | Yes | Business meaning for L&D / auditors |
| `severity` | Yes | `CRITICAL` \| `HIGH` \| `MEDIUM` \| `LOW` |
| `priority` | No | Lower number = evaluated first (default 100) |
| `enabled` | No | Default `true` |
| `version` | No | Rule version for audit |
| `effectiveFrom` / `effectiveTo` | No | ISO dates for time-bound rules |
| `conditions` | Yes | Tree: `operator` + `criteria[]` |
| `actions` | Yes | Alerts, risk tags, suggested interventions |
| `applicableTo` | No | Scope: roles, departments, training types, competencies |

### 3.2 Condition operators

**Logical:** `AND`, `OR`, `NOT` (nested `conditions` object)

**Criterion `operator` (metric vs value):**

| Operator | Meaning |
|----------|---------|
| `less_than` | metric < value |
| `less_than_or_equal` | metric ≤ value |
| `greater_than` | metric > value |
| `greater_than_or_equal` | metric ≥ value |
| `equals` | metric == value |
| `not_equals` | metric != value |
| `between` | value = `[min, max]` |
| `in` | metric in list |
| `consecutive_count` | e.g. N failures in a row |
| `trend_decline_percent` | % drop over `period` |

**Common `metric` names (employee profile snapshot):**

| Metric | Source (ingestion) |
|--------|-------------------|
| `attendance_percentage` | Training attendance records |
| `mandatory_completion_percentage` | Required trainings |
| `assessment_score` | Latest or average assessment |
| `consecutive_assessment_failures` | Periodic assessments |
| `score_trend_decline_percent` | Assessments over time |
| `milestone_status` | `MET` \| `NOT_MET` \| `OVERDUE` |
| `days_milestone_overdue` | Competency milestones |
| `days_since_last_milestone_progress` | Competency progression |
| `days_to_compliance_deadline` | Compliance calendar |
| `days_since_intervention_closed` | Intervention outcomes |
| `post_intervention_score_improved` | boolean (0/1) |
| `certification_days_to_expiry` | Cert records |
| `open_intervention_count` | Intervention tracking |

### 3.3 Actions (corporate)

| Action key | Example values |
|------------|----------------|
| `alert` | `employee`, `manager`, `ld_admin`, `trainer`, `compliance_officer`, `mentor` |
| `riskTag` | `ATTENDANCE_RISK`, `COMPLIANCE_RISK`, `COMPETENCY_GAP` |
| `intervention` | `remedial_training`, `coaching_mentoring`, `manager_escalation`, `compliance_escalation` |
| `setRiskLevel` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `notifyChannel` | `email`, `in_app`, `teams` (implementation detail) |

### 3.4 Baseline example (from implementation guide, adapted)

**Scenario:** Mandatory training attendance critically low in the last 30 days.

```json
{
  "ruleId": "RISK_CORP_001",
  "ruleName": "Critical Mandatory Training Attendance",
  "description": "Employee mandatory training attendance below 75% in the last 30 days",
  "severity": "HIGH",
  "priority": 10,
  "enabled": true,
  "version": "1.0",
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "attendance_percentage",
        "trainingType": "MANDATORY",
        "period": "30_days",
        "operator": "less_than",
        "value": 75
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["ATTENDANCE_RISK"],
    "alert": ["employee", "manager", "ld_admin"],
    "intervention": ["remedial_training"]
  },
  "applicableTo": {
    "trainingTypes": ["MANDATORY"],
    "employmentStatus": ["ACTIVE"]
  }
}
```

---

## 4. Risk rule catalog (additional scenarios)

Rules below use the **same schema**. Criteria names assume the **employee learning profile** is pre-aggregated before rule execution.

---

### RISK_CORP_002 — Consecutive assessment failures

**Business intent:** Employee failed two or more assessments in a row (skills not retained).

**Problem statement link:** Periodic assessment scores; at-risk classification.

```json
{
  "ruleId": "RISK_CORP_002",
  "ruleName": "Consecutive Assessment Failures",
  "description": "Two or more consecutive assessment attempts below pass threshold",
  "severity": "HIGH",
  "priority": 20,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "consecutive_assessment_failures",
        "operator": "greater_than_or_equal",
        "value": 2
      },
      {
        "metric": "assessment_type",
        "operator": "in",
        "value": ["PERIODIC", "CERTIFICATION"]
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["ASSESSMENT_RISK"],
    "alert": ["employee", "trainer", "ld_admin"],
    "intervention": ["remedial_training"]
  },
  "applicableTo": {
    "trainingTypes": ["MANDATORY", "COMPLIANCE"]
  }
}
```

---

### RISK_CORP_003 — Assessment score decline trend

**Business intent:** Early warning before outright failure — declining performance over 60 days.

**Problem statement link:** Early intervention (proactive vs reactive).

```json
{
  "ruleId": "RISK_CORP_003",
  "ruleName": "Assessment Score Decline Trend",
  "description": "Assessment scores declined by 20% or more over the last 60 days",
  "severity": "MEDIUM",
  "priority": 30,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "score_trend_decline_percent",
        "period": "60_days",
        "operator": "greater_than_or_equal",
        "value": 20
      },
      {
        "metric": "assessment_attempt_count",
        "period": "60_days",
        "operator": "greater_than_or_equal",
        "value": 2
      }
    ]
  },
  "actions": {
    "setRiskLevel": "MEDIUM",
    "riskTag": ["TREND_RISK"],
    "alert": ["manager", "ld_admin"],
    "intervention": ["coaching_mentoring"]
  }
}
```

---

### RISK_CORP_004 — Competency milestone overdue

**Business intent:** Required competency not achieved by target date.

**Problem statement link:** Competency-level learning milestones; competency progression.

```json
{
  "ruleId": "RISK_CORP_004",
  "ruleName": "Competency Milestone Overdue",
  "description": "Required competency milestone overdue by more than 14 days",
  "severity": "HIGH",
  "priority": 15,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "milestone_status",
        "operator": "equals",
        "value": "OVERDUE"
      },
      {
        "metric": "days_milestone_overdue",
        "operator": "greater_than",
        "value": 14
      },
      {
        "metric": "milestone_required",
        "operator": "equals",
        "value": true
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["COMPETENCY_GAP"],
    "alert": ["employee", "manager", "ld_admin"],
    "intervention": ["remedial_training", "coaching_mentoring"]
  },
  "applicableTo": {
    "competencyLevels": ["L1", "L2", "L3"]
  }
}
```

---

### RISK_CORP_005 — Composite: low attendance and failing assessment

**Business intent:** Multi-factor at-risk — disengagement plus poor outcomes.

**Problem statement link:** Configurable risk rules; composite rules (evaluation parameter).

```json
{
  "ruleId": "RISK_CORP_005",
  "ruleName": "Composite Attendance and Assessment Risk",
  "description": "Mandatory attendance below 80% AND latest assessment below pass threshold",
  "severity": "CRITICAL",
  "priority": 5,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "attendance_percentage",
        "trainingType": "MANDATORY",
        "period": "30_days",
        "operator": "less_than",
        "value": 80
      },
      {
        "metric": "assessment_score",
        "operator": "less_than",
        "value": 70
      }
    ]
  },
  "actions": {
    "setRiskLevel": "CRITICAL",
    "riskTag": ["ATTENDANCE_RISK", "ASSESSMENT_RISK"],
    "alert": ["employee", "manager", "ld_admin", "compliance_officer"],
    "intervention": ["remedial_training", "coaching_mentoring", "manager_escalation"]
  }
}
```

---

### RISK_CORP_006 — Compliance deadline imminent

**Business intent:** Regulatory/mandatory training due within 7 days but not complete.

**Problem statement link:** Compliance with regulatory bodies; compliance-ready reporting.

```json
{
  "ruleId": "RISK_CORP_006",
  "ruleName": "Compliance Training Deadline Imminent",
  "description": "Mandatory compliance training incomplete with deadline within 7 days",
  "severity": "CRITICAL",
  "priority": 1,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "mandatory_completion_percentage",
        "trainingType": "COMPLIANCE",
        "operator": "less_than",
        "value": 100
      },
      {
        "metric": "days_to_compliance_deadline",
        "operator": "less_than_or_equal",
        "value": 7
      }
    ]
  },
  "actions": {
    "setRiskLevel": "CRITICAL",
    "riskTag": ["COMPLIANCE_RISK"],
    "alert": ["employee", "manager", "compliance_officer", "ld_admin"],
    "intervention": ["remedial_training", "compliance_escalation"]
  },
  "applicableTo": {
    "trainingTypes": ["COMPLIANCE"]
  }
}
```

---

### RISK_CORP_007 — Competency progression stalled

**Business intent:** No milestone progress for 90 days on an active development path.

**Problem statement link:** Competency-level progression; early detection.

```json
{
  "ruleId": "RISK_CORP_007",
  "ruleName": "Competency Progression Stalled",
  "description": "No competency milestone progress for 90 days on assigned development path",
  "severity": "MEDIUM",
  "priority": 40,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "days_since_last_milestone_progress",
        "operator": "greater_than",
        "value": 90
      },
      {
        "metric": "has_active_development_path",
        "operator": "equals",
        "value": true
      }
    ]
  },
  "actions": {
    "setRiskLevel": "MEDIUM",
    "riskTag": ["COMPETENCY_STAGNATION"],
    "alert": ["employee", "manager", "ld_admin"],
    "intervention": ["coaching_mentoring"]
  }
}
```

---

### RISK_CORP_008 — Post-intervention no improvement

**Business intent:** Prior intervention closed but scores/attendance did not improve.

**Problem statement link:** Intervention history and outcome tracking.

```json
{
  "ruleId": "RISK_CORP_008",
  "ruleName": "Intervention Ineffective — No Improvement",
  "description": "Within 30 days after intervention closure, no measurable improvement in score or attendance",
  "severity": "HIGH",
  "priority": 25,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "days_since_intervention_closed",
        "operator": "less_than_or_equal",
        "value": 30
      },
      {
        "metric": "post_intervention_score_improved",
        "operator": "equals",
        "value": false
      },
      {
        "metric": "post_intervention_attendance_improved",
        "operator": "equals",
        "value": false
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["INTERVENTION_INEFFECTIVE"],
    "alert": ["ld_admin", "manager"],
    "intervention": ["coaching_mentoring", "manager_escalation"]
  }
}
```

---

### RISK_CORP_009 — Certification expiring without renewal training

**Business intent:** Role-required certification expires soon; renewal path incomplete.

**Problem statement link:** Compliance + competency milestones.

```json
{
  "ruleId": "RISK_CORP_009",
  "ruleName": "Certification Expiry Risk",
  "description": "Role-required certification expires within 30 days and renewal training not completed",
  "severity": "CRITICAL",
  "priority": 8,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "certification_days_to_expiry",
        "operator": "less_than_or_equal",
        "value": 30
      },
      {
        "metric": "renewal_training_completion_percentage",
        "operator": "less_than",
        "value": 100
      }
    ]
  },
  "actions": {
    "setRiskLevel": "CRITICAL",
    "riskTag": ["CERTIFICATION_RISK", "COMPLIANCE_RISK"],
    "alert": ["employee", "manager", "compliance_officer"],
    "intervention": ["remedial_training", "compliance_escalation"]
  }
}
```

---

### RISK_CORP_010 — New hire onboarding gap

**Business intent:** Employees in first 90 days behind onboarding competency pack.

**Problem statement link:** Employee learning profile aggregation; milestones.

```json
{
  "ruleId": "RISK_CORP_010",
  "ruleName": "New Hire Onboarding Gap",
  "description": "Employee in first 90 days with onboarding milestone completion below 50%",
  "severity": "HIGH",
  "priority": 18,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "tenure_days",
        "operator": "less_than_or_equal",
        "value": 90
      },
      {
        "metric": "onboarding_milestone_completion_percentage",
        "operator": "less_than",
        "value": 50
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["ONBOARDING_RISK"],
    "alert": ["employee", "manager", "ld_admin"],
    "intervention": ["remedial_training", "coaching_mentoring"]
  },
  "applicableTo": {
    "employeeCategory": ["NEW_HIRE"]
  }
}
```

---

### RISK_CORP_011 — Multiple competency gaps

**Business intent:** Employee missing more than one required milestone in the same role.

**Problem statement link:** Competency-level progression.

```json
{
  "ruleId": "RISK_CORP_011",
  "ruleName": "Multiple Required Competency Gaps",
  "description": "Three or more required competency milestones not met for current role",
  "severity": "HIGH",
  "priority": 22,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "required_milestones_not_met_count",
        "operator": "greater_than_or_equal",
        "value": 3
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["COMPETENCY_GAP"],
    "alert": ["manager", "ld_admin"],
    "intervention": ["coaching_mentoring", "remedial_training"]
  }
}
```

---

### RISK_CORP_012 — Repeat at-risk after prior clearance

**Business intent:** Employee was cleared from at-risk status but triggered again within 60 days.

**Problem statement link:** Early intervention effectiveness; outcome tracking.

```json
{
  "ruleId": "RISK_CORP_012",
  "ruleName": "Repeat At-Risk Within 60 Days",
  "description": "Employee reclassified as at-risk within 60 days of previous risk clearance",
  "severity": "HIGH",
  "priority": 12,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "days_since_last_risk_cleared",
        "operator": "less_than_or_equal",
        "value": 60
      },
      {
        "metric": "current_risk_triggered",
        "operator": "equals",
        "value": true
      }
    ]
  },
  "actions": {
    "setRiskLevel": "HIGH",
    "riskTag": ["RECURRENCE_RISK"],
    "alert": ["ld_admin", "manager"],
    "intervention": ["coaching_mentoring", "manager_escalation"]
  }
}
```

---

### RISK_CORP_013 — Coaching assignment overdue (workflow)

**Business intent:** At-risk employee has open coaching intervention past due date.

**Problem statement link:** Coaching and mentoring assignments; intervention tracking.

```json
{
  "ruleId": "RISK_CORP_013",
  "ruleName": "Coaching Assignment Overdue",
  "description": "Assigned coaching/mentoring session overdue by more than 7 days",
  "severity": "MEDIUM",
  "priority": 35,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "open_intervention_type",
        "operator": "equals",
        "value": "coaching_mentoring"
      },
      {
        "metric": "intervention_days_overdue",
        "operator": "greater_than",
        "value": 7
      }
    ]
  },
  "actions": {
    "setRiskLevel": "MEDIUM",
    "riskTag": ["INTERVENTION_OVERDUE"],
    "alert": ["mentor", "ld_admin", "manager"],
    "intervention": []
  }
}
```

*Note: This rule escalates workflow slippage; it does not create a duplicate intervention.*

---

### RISK_CORP_014 — Low attendance on compliance training only

**Business intent:** Stricter threshold for compliance-tagged sessions (audit exposure).

```json
{
  "ruleId": "RISK_CORP_014",
  "ruleName": "Compliance Session Attendance Critical",
  "description": "Attendance below 90% on compliance-tagged sessions in last 90 days",
  "severity": "CRITICAL",
  "priority": 6,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "attendance_percentage",
        "trainingType": "COMPLIANCE",
        "period": "90_days",
        "operator": "less_than",
        "value": 90
      }
    ]
  },
  "actions": {
    "setRiskLevel": "CRITICAL",
    "riskTag": ["COMPLIANCE_RISK", "ATTENDANCE_RISK"],
    "alert": ["compliance_officer", "ld_admin", "manager"],
    "intervention": ["remedial_training", "compliance_escalation"]
  }
}
```

---

### RISK_CORP_015 — Optional upskilling neglect (watchlist)

**Business intent:** Non-mandatory upskilling stalled; useful for L&D portfolio analytics, not audit.

```json
{
  "ruleId": "RISK_CORP_015",
  "ruleName": "Optional Upskilling Stagnation",
  "description": "No progress on optional upskilling path for 120 days",
  "severity": "LOW",
  "priority": 90,
  "conditions": {
    "operator": "AND",
    "criteria": [
      {
        "metric": "days_since_last_milestone_progress",
        "trainingType": "OPTIONAL",
        "operator": "greater_than",
        "value": 120
      }
    ]
  },
  "actions": {
    "setRiskLevel": "LOW",
    "riskTag": ["UPSKILLING_STAGNATION"],
    "alert": ["employee", "ld_admin"],
    "intervention": ["coaching_mentoring"]
  },
  "applicableTo": {
    "trainingTypes": ["OPTIONAL"]
  }
}
```

---

## 5. Rule type coverage matrix

| Rule ID | Type | Primary data source | Severity | Suggested intervention |
|---------|------|---------------------|----------|------------------------|
| RISK_CORP_001 | Attendance | Attendance API | HIGH | Remedial training |
| RISK_CORP_002 | Assessment | Assessment API | HIGH | Remedial training |
| RISK_CORP_003 | Trend | Assessments over time | MEDIUM | Coaching/mentoring |
| RISK_CORP_004 | Milestone | Competency milestones | HIGH | Remedial + coaching |
| RISK_CORP_005 | Composite | Attendance + assessment | CRITICAL | Both + escalation |
| RISK_CORP_006 | Time-sensitive / compliance | Compliance calendar | CRITICAL | Remedial + compliance escalation |
| RISK_CORP_007 | Milestone / stagnation | Milestone history | MEDIUM | Coaching/mentoring |
| RISK_CORP_008 | Intervention outcome | Intervention module | HIGH | Escalation |
| RISK_CORP_009 | Certification / compliance | HR/cert + training | CRITICAL | Remedial + compliance |
| RISK_CORP_010 | Onboarding | Profile + milestones | HIGH | Remedial + coaching |
| RISK_CORP_011 | Multi-milestone | Competency framework | HIGH | Coaching + remedial |
| RISK_CORP_012 | Recurrence | Risk history | HIGH | Manager escalation |
| RISK_CORP_013 | Workflow | Intervention tracking | MEDIUM | Alert only |
| RISK_CORP_014 | Compliance attendance | Attendance (compliance tag) | CRITICAL | Compliance path |
| RISK_CORP_015 | Optional / upskilling | Milestones (optional) | LOW | Coaching |

---

## 6. Execution notes (implementation)

1. **Profile first:** Aggregate attendance, scores, milestones, interventions into one snapshot per employee per run.
2. **Filter by `applicableTo`:** Skip rules outside role/department/training scope.
3. **Evaluate by `priority`:** Lower number first; highest `severity` wins for `setRiskLevel` if multiple rules fire.
4. **Idempotency:** Same inputs + same rule versions → same risk output (audit-friendly).
5. **Version rules:** Store `version`, `effectiveFrom`, `effectiveTo`; never mutate history in place.
6. **Test harness:** JSON fixtures per rule with sample employee profiles (pass/fail cases).

---

## 7. Traceability to problem statement

| PS requirement | Rules |
|----------------|-------|
| Training attendance | 001, 005, 014 |
| Periodic assessment scores | 002, 003, 005 |
| Competency milestones | 004, 007, 010, 011, 015 |
| Configurable thresholds | All (values in JSON) |
| At-risk classification | `setRiskLevel`, `riskTag` |
| Remedial training | `remedial_training` action |
| Coaching/mentoring | `coaching_mentoring` action |
| Compliance reporting | 006, 009, 014 + `compliance_officer` alerts |
| Intervention effectiveness | 008, 012, 013 |

---

*End of document*
