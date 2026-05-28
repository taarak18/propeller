# User Journeys

## Corporate L&D SaaS — Multi-Tenant (Production-Ready v2.0)

> **Changes from v1.0:** Added Consent Capture journey (GDPR / DPDP / CCPA / PIPEDA). Added Right-to-Erasure request journey. Added Human-Review gate in Trainer journey (GDPR Art.22). Added Accessibility compliance notes throughout. WebSocket live alerts referenced in dashboards.

---

## Role Overview

```mermaid
mindmap
  root((LearnTrack Corporate L&D SaaS))
    Platform Admin
      Manage all organisations
      Monitor platform health - OTel dashboards
      Manage billing and Stripe usage
    L&D Administrator
      Configure organisation settings
      Manage users and roles
      Define competency risk rules
      Generate compliance reports
      Manage consent disclosures per jurisdiction
    Trainer
      View team learning dashboard - live WebSocket alerts
      Review at-risk employees
      Complete human-review gate for automated risk
      Assign remedial training sessions
      Log coaching session attendance
    L&D Manager
      Manage intervention caseload
      Approve remedial training and coaching
      Track employee competency progress
      Record intervention outcomes
    Employee
      View own learning profile
      Track training attendance
      Monitor competency milestone status
      Manage own consent and privacy preferences
      Request own data erasure
```

---

## Accessibility Standards Baseline

All user-facing portals (Trainer, L&D Admin, L&D Manager, Employee) must meet:

| Standard | Requirement |
|---|---|
| WCAG 2.1 Level AA | All web content (EU, UK, US, Canada, India) |
| European Accessibility Act (EAA) / EN 301 549 | Required for EU market access (enforcement active since 28 June 2025) |
| Section 508 | US federal tenant customers |
| ADA digital | US-based tenants (case-law applies to SaaS) |

**Accessibility principles applied to all journeys below:**
- All interactive controls reachable via keyboard (Tab / Shift+Tab / Enter / Space / Arrow keys)
- All charts and data visualisations have accessible text alternatives or data tables
- Colour alone is never the sole indicator (risk badges use colour + icon + text)
- Form errors announced to screen readers via `aria-live` and `aria-describedby`
- WCAG contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text
- Focus indicators visible at all times (not suppressed by CSS `outline: none`)

---

## Journey 1 — New Corporate Customer Onboards as a SaaS Tenant

```mermaid
journey
    title Corporate L&D Team Signs Up for LearnTrack SaaS
    section Discovery
      Visit learntrack.io marketing site: 5: L&D Admin
      Compare Starter Pro Enterprise plans: 4: L&D Admin
      Review GDPR DPA and DPDP compliance documentation: 4: L&D Admin
    section Sign Up
      Complete accessible online organisation registration form: 5: L&D Admin
      Select plan, billing cycle, and data region: 4: L&D Admin
      Accept Data Processing Agreement (DPA): 4: L&D Admin
      Submit payment details via Stripe: 4: L&D Admin
    section Automated Provisioning (Temporal Saga)
      System creates tenant record: 5: System
      System provisions DB schema - dedicated DB for Enterprise: 5: System
      System seeds default competency risk rules (15 starter): 5: System
      System seeds compliance report templates: 5: System
      System creates L&D Admin account: 5: System
    section Go Live
      L&D Admin receives welcome email with portal URL: 5: L&D Admin
      L&D Admin logs in - WCAG 2.1 AA portal: 4: L&D Admin
      L&D Admin configures consent disclosures per employee jurisdiction: 4: L&D Admin
      L&D Admin invites trainers and L&D managers: 4: L&D Admin
      First employee training data imported from LMS: 4: L&D Admin
```

---

## Journey 2 — Employee Completes Consent Capture (GDPR / DPDP / CCPA / PIPEDA)

> **New in v2.** Triggered on first login or when tenant adds a new processing purpose.

```mermaid
journey
    title Employee Reviews and Grants Consent
    section First Login
      Employee receives portal invitation email: 5: Employee
      Employee sets password - accessible password form: 5: Employee
      System detects missing consents for employee jurisdiction: 5: System
    section Consent Presentation
      System presents consent disclosure in plain language: 5: System
      Employee reads purpose: risk profiling and competency tracking: 4: Employee
      Employee reads legal basis: legitimate interest contract: 4: Employee
      Employee sees opt-out option for automated risk profiling: 5: System
    section Consent Decision
      Employee grants consent to risk_profiling and benchmarking: 5: Employee
      Employee opts out of anonymised_benchmarking: 4: Employee
      System records consents with timestamp and jurisdiction: 5: System
      Audit log captures consent event as immutable record: 5: System
    section Ongoing Management
      Employee accesses Privacy Preferences from profile menu: 4: Employee
      Employee views history of consents granted and withdrawn: 4: Employee
      Employee withdraws risk_profiling consent: 3: Employee
      System suppresses future automated risk assessments for employee: 5: System
```

---

## Journey 3 — Trainer Identifies and Acts on At-Risk Employee (with Human-Review Gate)

> **v2 change:** Trainer must acknowledge the automated risk classification before employee notification is sent (GDPR Art.22 human-review gate).

```mermaid
journey
    title Trainer Acts on At-Risk Competency Alert
    section Live Dashboard Alert
      Login to LearnTrack portal: 5: Trainer
      View team at-risk summary widget - WebSocket live updates: 5: Trainer
      Receive HIGH risk alert badge on employee card: 5: System
    section Human-Review Gate (GDPR Art.22)
      Open risk classification review panel: 5: Trainer
      Read automated risk factors - attendance trend - assessment scores: 4: Trainer
      Select decision: CONFIRM or OVERRIDE or DISMISS: 4: Trainer
      System records review decision and reviewer identity: 5: System
      System dispatches employee notification only after review confirmed: 5: System
    section Employee Profile Review
      Open at-risk employee learning profile: 5: Trainer
      Review training attendance heatmap last 30 days: 4: Trainer
      Review consecutive failing competency assessments: 4: Trainer
      Review overdue competency milestones: 3: Trainer
    section Intervention Assignment
      Select intervention type: remedial training session: 4: Trainer
      Set competency focus schedule and duration: 4: Trainer
      Submit for L&D Manager approval: 5: Trainer
    section Follow-Up
      Receive approval confirmation from L&D Manager: 5: Trainer
      Log each remedial training session attendance: 4: Trainer
      Add competency progress notes per session: 3: Trainer
      View mid-intervention competency score update: 4: Trainer
```

---

## Journey 4 — L&D Manager Manages Intervention Lifecycle

```mermaid
journey
    title L&D Manager Approves and Tracks Intervention
    section Receive Notification
      Receive pending approval alert via email and in-app: 5: L&D Manager
      Review intervention request and employee risk profile: 5: L&D Manager
      Check employee intervention history: 4: L&D Manager
      Check human-review gate was completed by Trainer: 4: L&D Manager
    section Approval Decision
      Approve remedial training and confirm start date: 5: L&D Manager
      System starts Temporal intervention workflow: 5: System
      Trainer employee and line manager notified: 5: System
    section Monitor Progress
      View intervention calendar for caseload: 4: L&D Manager
      Track training session attendance count: 4: L&D Manager
      Review mid-point competency score metrics: 4: L&D Manager
    section Escalation (if SLA breached)
      Receive Temporal-triggered escalation alert at 48h: 4: L&D Manager
      Acknowledge escalation and extend deadline or reassign: 3: L&D Manager
    section Outcome Recording
      Mark intervention completed: 5: L&D Manager
      Enter post-intervention competency scores: 4: L&D Manager
      System calculates improvement percentage: 5: System
      View intervention effectiveness report: 5: L&D Manager
```

---

## Journey 5 — L&D Administrator Generates Compliance Report

```mermaid
journey
    title L&D Admin Produces Regulatory Compliance Report
    section Preparation
      Login to LearnTrack admin dashboard - accessible UI: 5: L&D Admin
      View compliance calendar widget with upcoming deadlines: 5: L&D Admin
      Confirm CDC-fed aggregates are fresh (less than 1 hour): 4: L&D Admin
    section Report Generation
      Select compliance report type and template: 5: L&D Admin
      Set department date range and competency filters: 4: L&D Admin
      Trigger report generation: 5: L&D Admin
      System pseudonymises opted-out employees in report: 5: System
      System assembles training and competency dataset: 5: System
    section Review and Submit
      Preview generated accessible PDF compliance report: 4: L&D Admin
      Verify attendance and competency data accuracy: 4: L&D Admin
      Approve and publish to portal: 5: L&D Admin
      System stores report in S3 with Object Lock: 5: System
      System logs to hash-chained immutable audit trail: 5: System
    section Distribution
      Report emailed to regulatory contact or downloaded: 5: L&D Admin
      Archive copy stored in S3 Object Lock bucket: 5: System
      Confirmation and checksum sent to L&D Admin: 4: System
```

---

## Journey 6 — Employee Monitors Own Learning Progress

```mermaid
journey
    title Employee Uses Self-Service Learning Portal
    section Portal Access
      Receive portal invitation email: 5: Employee
      Set password using accessible form - keyboard navigable: 5: Employee
      Complete consent capture on first login: 5: Employee
      View personal learning dashboard: 5: Employee
    section Progress Review
      View training attendance summary in accessible table and chart: 5: Employee
      See recent assessment scores by competency: 5: Employee
      View competency milestone completion progress bar: 4: Employee
      Review learning performance trend chart - text alternative available: 4: Employee
    section Intervention Awareness
      Receive in-app notification of active remedial training: 4: Employee
      View remedial training schedule: 4: Employee
      Read trainer session notes and feedback: 3: Employee
    section Post-Intervention
      View post-intervention competency improvement charts: 5: Employee
      Acknowledge progress update: 4: Employee
```

---

## Journey 7 — Employee Requests Own Data Erasure (GDPR / DPDP / CCPA)

> **New in v2.** Supports right-to-erasure obligations across all target compliance regions.

```mermaid
journey
    title Employee Submits and Tracks Erasure Request
    section Request Submission
      Navigate to Privacy Preferences in employee portal: 5: Employee
      Select Request Data Erasure: 5: Employee
      Review what data will be erased and what is retained for legal reasons: 5: System
      Confirm identity via re-authentication: 4: Employee
      Submit erasure request: 5: Employee
      Receive 202 Accepted with tracking reference and expected completion date: 5: System
    section Processing (Background)
      Temporal erasure saga starts: 5: System
      System anonymises PII across profile - risk - intervention services: 5: System
      System redacts opt-out employee from existing reports: 5: System
      System retains pseudonymised audit log entries for legal period: 5: System
      System generates signed deletion certificate: 5: System
    section Completion
      Employee receives completion notification with certificate link: 5: System
      Employee downloads signed deletion certificate: 4: Employee
```

---

## Journey 8 — L&D Administrator Configures a New Competency Risk Rule

```mermaid
journey
    title L&D Admin Defines and Activates a New Competency Risk Rule
    section Rule Design
      Navigate to Rule Management module: 5: L&D Admin
      Select Create New Competency Rule: 5: L&D Admin
      Define rule metadata: name severity priority applicable departments: 4: L&D Admin
    section Rule Configuration
      Set conditions using accessible rule builder UI: 4: L&D Admin
      Define attendance threshold: 4: L&D Admin
      Define score threshold: 4: L&D Admin
      Add composite AND operator: 3: L&D Admin
      Set requireHumanReview flag for CRITICAL rules: 4: L&D Admin
    section Testing
      Open rule test sandbox: 4: L&D Admin
      Load sample employee profiles: 5: L&D Admin
      Review matched employees and false positive rate: 4: L&D Admin
      Adjust thresholds based on test results: 3: L&D Admin
    section Activation
      Save rule as versioned definition: 5: L&D Admin
      Activate rule - system invalidates Redis rules cache: 5: L&D Admin
      Monitor first-run at-risk alerts in real time: 4: L&D Admin
```

---

## Role-Based Dashboard Layouts

### Trainer Dashboard

```mermaid
graph TD
    subgraph TrD["Trainer Dashboard — Acme Corp"]
        W1[Team Summary\nTotal Employees - At-Risk Count - Avg Competency Score]
        W2[At-Risk Employees List\nSorted by risk level\nColour + icon + text badges - WCAG AA]
        W3[Pending Human Reviews\nRisk assessments awaiting Trainer acknowledgement]
        W4[Competency Performance\nApexCharts bar chart by training module\nAccessible data table alternative]
        W5[Training Attendance Heatmap\nCalendar view - keyboard navigable]
        W6[My Active Interventions\nRemedial Training - Coaching - Status + Sessions]
        W7[Live Alerts\nWebSocket push feed]
    end
    W2 -->|Click employee| P[Employee Learning Profile\nAttendance - Scores - Milestones - Risk History]
    W3 -->|Click review| RV[Human-Review Panel\nConfirm - Override - Dismiss]
    W6 -->|Click intervention| I[Intervention Detail\nSchedule - Sessions - Outcomes]
```

### L&D Administrator Dashboard

```mermaid
graph TD
    subgraph AD["L&D Admin Dashboard — Organisation-Wide"]
        A1[Organisation L&D KPIs\nTotal Employees - At-Risk % - Avg Attendance]
        A2[Risk Distribution\nApexCharts donut: Critical - High - Medium - Low\nAccessible data table]
        A3[Intervention Effectiveness\nRemedial Training vs Coaching success rates]
        A4[Compliance Calendar\nUpcoming regulatory deadlines - Completion status]
        A5[Consent Coverage\n% employees with active consent per purpose]
        A6[Plan Usage Meters\nEmployees - Rules - API calls - Storage]
        A7[Erasure Requests In Progress\nPending - Completed count]
    end
    A4 -->|Click deadline| RPT[Compliance Report Generator]
    A5 -->|Click purpose| CONS[Consent Management Panel]
    A6 -->|Approaching limit| UPG[Plan Upgrade Prompt]
```

### L&D Manager Dashboard

```mermaid
graph TD
    subgraph CO["L&D Manager Dashboard"]
        C1[My Caseload\nActive interventions assigned to me]
        C2[Pending Approvals\nRemedial training and coaching requests]
        C3[Intervention Calendar\nWeekly schedule - keyboard navigable]
        C4[Effectiveness Summary\nAvg competency improvement % by type]
        C5[Escalation Queue\nCritical employees needing immediate action]
        C6[SLA Breaches\nInterventions overdue - Temporal escalation triggered]
    end
    C1 -->|Click employee| P2[Employee Profile + Intervention History]
    C2 -->|Approve or Reject| WF[Approval Workflow]
```

### Employee Self-Service Portal

```mermaid
graph TD
    subgraph EP["Employee Portal"]
        P1[Training Attendance Summary\nPresent - Absent - Excused\nAccessible table + chart]
        P2[Recent Assessment Scores\nLast 5 scores with competency labels]
        P3[Competency Milestone Progress\nCompletion % by competency area]
        P4[Learning Performance Trend\nApexCharts line chart - text alternative]
        P5[Active Interventions\nType - Schedule - Sessions remaining]
        P6[Trainer Feedback\nLatest session notes]
        P7[Privacy Preferences\nConsent management - Erasure request]
    end
    P7 -->|Manage consents| CONS[Consent Panel]
    P7 -->|Request erasure| ERA[Erasure Request Form]
```

---

## Notification Touch-Points

```mermaid
sequenceDiagram
    participant SYS as System
    participant TRAINER as Trainer
    participant LDMGR as L&D Manager
    participant LDADMIN as L&D Administrator
    participant EMP as Employee
    participant PLATADMIN as Platform Admin

    Note over SYS: All notifications are organisation-scoped
    SYS->>TRAINER: At-risk alert HIGH - review required (human-review gate)
    SYS->>LDMGR: Remedial training pending approval
    SYS->>EMP: Remedial training assigned (after human review confirmed)
    SYS->>TRAINER: Session reminder 24h before training
    SYS->>LDMGR: Temporal escalation alert - intervention SLA breached
    SYS->>LDMGR: Intervention complete - record competency outcomes
    SYS->>LDADMIN: Weekly at-risk employee summary
    SYS->>LDADMIN: Regulatory compliance deadline 7 days
    SYS->>LDADMIN: Plan usage at 90% - consider upgrading
    SYS->>EMP: Competency improvement update post-intervention
    SYS->>LDADMIN: CRITICAL risk - employee compliance certification at risk
    SYS->>EMP: Consent expiry reminder - renewal required
    SYS->>EMP: Erasure request completed - certificate available
    SYS->>PLATADMIN: Tenant Temporal provisioning saga failed - action required
    SYS->>PLATADMIN: Organisation payment failed - suspension in 7 days
```
