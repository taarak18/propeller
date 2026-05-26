# User Journeys

# User Journeys — Corporate L&D SaaS Multi-Tenant

## Role Overview

```mermaid
mindmap
  root((LearnTrack Corporate L&D SaaS))
    Platform Admin
      Manage all organisations
      Onboard new corporate customers
      Monitor platform health
      Manage billing and plans
    L&D Administrator
      Configure organisation settings
      Manage users and roles
      Define competency risk rules
      Generate compliance reports
    Trainer
      View team learning dashboard
      Review at-risk employees
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
      View active interventions
```

---

## Journey 1 — New Corporate Customer Onboards as a SaaS Tenant

```mermaid
journey
    title Corporate L&D Team Signs Up for LearnTrack SaaS
    section Discovery
      Visit learntrack.io marketing site: 5: L&D Admin
      Compare Starter Pro Enterprise plans: 4: L&D Admin
      Request a demo with L&D use case: 5: L&D Admin, Sales
    section Sign Up
      Complete online organisation registration: 5: L&D Admin
      Select plan and billing cycle: 4: L&D Admin
      Submit payment details: 4: L&D Admin
    section Automated Provisioning
      System creates organisation tenant record: 5: System
      System provisions DB schema: 5: System
      System seeds default competency risk rules: 5: System
      System seeds compliance report templates: 5: System
      System creates L&D Admin account: 5: System
    section Go Live
      L&D Admin receives welcome email with portal URL: 5: L&D Admin, System
      L&D Admin logs in and configures branding: 4: L&D Admin
      L&D Admin invites trainers and L&D managers: 4: L&D Admin
      First employee training data imported from LMS: 4: L&D Admin, System
```

---

## Journey 2 — Trainer Identifies and Acts on an At-Risk Employee

```mermaid
journey
    title Trainer Acts on At-Risk Competency Alert
    section Dashboard Review
      Login to LearnTrack portal: 5: Trainer
      View team at-risk summary widget: 5: Trainer
      Receive HIGH risk alert for employee: 4: Trainer, System
    section Employee Profile Review
      Open at-risk employee learning profile: 5: Trainer
      Review training attendance trend last 30 days: 4: Trainer
      Review consecutive failing competency assessments: 4: Trainer
      Review overdue competency milestones: 3: Trainer
    section Intervention Assignment
      Select intervention type: remedial training session: 4: Trainer
      Set competency focus schedule and duration: 4: Trainer
      Submit for L&D Manager approval: 5: Trainer, System
    section Follow-Up
      Receive approval confirmation from L&D Manager: 5: Trainer, System
      Log each remedial training session attendance: 4: Trainer
      Add competency progress notes per session: 3: Trainer
      View mid-intervention competency score update: 4: Trainer, System
```

---

## Journey 3 — L&D Manager Manages Intervention Lifecycle

```mermaid
journey
    title L&D Manager Approves and Tracks Intervention
    section Receive Notification
      Receive pending approval alert for remedial training: 5: System, L&D Manager
      Review intervention request and employee risk profile: 5: L&D Manager
      Check employee intervention history: 4: L&D Manager
    section Approval Decision
      Approve remedial training and confirm start date: 5: L&D Manager
      System notifies trainer and employee: 5: System
      Add employee to L&D Manager caseload: 4: L&D Manager
    section Monitor Progress
      View intervention calendar for caseload: 4: L&D Manager
      Track training session attendance count: 4: L&D Manager
      Review mid-point competency score metrics: 4: L&D Manager, System
    section Outcome Recording
      Mark intervention as completed: 5: L&D Manager
      Enter post-intervention competency scores and attendance: 4: L&D Manager
      System calculates improvement percentage: 5: System
      View intervention effectiveness report: 5: L&D Manager, System
```

---

## Journey 4 — L&D Administrator Generates Compliance Report

```mermaid
journey
    title L&D Admin Produces Regulatory Compliance Report
    section Preparation
      Login to LearnTrack admin dashboard: 5: L&D Admin
      View compliance calendar widget: 5: L&D Admin
      Check upcoming regulatory submission deadlines: 4: L&D Admin
    section Report Generation
      Select compliance report type and template: 5: L&D Admin
      Set department date range and competency filters: 4: L&D Admin
      Trigger report generation: 5: L&D Admin
      System aggregates training and competency data: 5: System
    section Review and Submit
      Preview generated PDF compliance report: 4: L&D Admin
      Verify accuracy of attendance and competency data: 4: L&D Admin
      Approve and publish to portal: 5: L&D Admin
      System logs to immutable audit trail: 5: System
    section Distribution
      Report emailed to regulatory body or industry authority: 5: System
      Archive copy stored in object storage: 5: System
      Confirmation received by L&D Admin: 4: L&D Admin
```

---

## Journey 5 — Employee Monitors Own Learning Progress

```mermaid
journey
    title Employee Uses Self-Service Learning Portal
    section Portal Access
      Receive portal invitation email from L&D Admin: 5: Employee, System
      Set password and login: 5: Employee
      View personal learning dashboard: 5: Employee
    section Progress Review
      View training attendance summary for current period: 5: Employee
      See recent assessment scores by competency: 5: Employee
      View competency milestone completion percentage: 4: Employee
      Review learning performance trend last 3 months: 4: Employee
    section Intervention Awareness
      Receive notification of active remedial training: 4: System, Employee
      View remedial training schedule and session count: 4: Employee
      Read trainer session notes and feedback: 3: Employee
    section Outcome Update
      View post-intervention competency improvement charts: 5: Employee, System
      Acknowledge progress update: 4: Employee
```

---

## Journey 6 — L&D Administrator Configures Competency Risk Rules

```mermaid
journey
    title L&D Admin Defines and Activates a New Competency Risk Rule
    section Rule Design
      Navigate to Rule Management module: 5: L&D Admin
      Select Create New Competency Rule: 5: L&D Admin
      Define rule metadata: name severity applicable departments: 4: L&D Admin
    section Rule Configuration
      Set conditions using rule builder UI: 4: L&D Admin
      Define attendance threshold for training module: 4: L&D Admin
      Define score threshold for competency assessment: 4: L&D Admin
      Add composite AND operator for combined risk: 3: L&D Admin
    section Testing
      Open rule test sandbox: 4: L&D Admin
      Load sample employee profiles: 5: L&D Admin, System
      Review matched employees and false positive rate: 4: L&D Admin
      Adjust thresholds based on test results: 3: L&D Admin
    section Activation
      Save rule as versioned definition: 5: L&D Admin
      Activate rule for target departments and competencies: 5: L&D Admin
      System adds rule to active execution set: 5: System
      Monitor first-run at-risk alerts: 4: L&D Admin, System
```

---

## Role-Based Dashboard Layouts

### Trainer Dashboard

```mermaid
graph TD
    subgraph TD["Trainer Dashboard — e.g. Acme Corp"]
        W1[Team Summary\nTotal Employees · At-Risk Count · Avg Competency Score]
        W2[At-Risk Employees List\nSorted by Risk Level with severity badges]
        W3[Competency Performance\nBar chart by training module]
        W4[Training Attendance Heatmap\nTeam calendar view]
        W5[My Active Interventions\nRemedial Training · Coaching — Status + Sessions]
        W6[Recent Alerts\nNotification feed]
    end
    W2 -->|Click employee| P[Employee Learning Profile\nAttendance · Scores · Milestones · Risk History]
    W5 -->|Click intervention| I[Intervention Detail\nSchedule · Sessions · Competency Outcomes]
```

### L&D Administrator Dashboard

```mermaid
graph TD
    subgraph AD["L&D Admin Dashboard — Organisation-Wide"]
        A1[Organisation L&D KPIs\nTotal Employees · At-Risk % · Avg Training Attendance]
        A2[Risk Distribution\nPie: Critical · High · Medium · Low]
        A3[Intervention Effectiveness\nRemedial Training vs Coaching success rates]
        A4[Compliance Calendar\nUpcoming regulatory deadlines · Completion status]
        A5[Plan Usage Meters\nEmployees · Rules · API calls · Storage]
        A6[User Activity\nActive trainers and L&D managers last 30 days]
    end
    A4 -->|Click deadline| RPT[Compliance Report Generator]
    A5 -->|Approaching limit| UPG[Plan Upgrade Prompt]
```

### L&D Manager Dashboard

```mermaid
graph TD
    subgraph CO["L&D Manager Dashboard"]
        C1[My Caseload\nActive interventions assigned to me]
        C2[Pending Approvals\nRemedial training and coaching requests awaiting action]
        C3[Intervention Calendar\nWeekly schedule view]
        C4[Effectiveness Summary\nAvg competency improvement % by intervention type]
        C5[Escalation Queue\nCritical employees requiring immediate action]
    end
    C1 -->|Click employee| P2[Employee Profile + Intervention History]
    C2 -->|Approve or Reject| WF[Approval Workflow]
```

### Employee Self-Service Portal

```mermaid
graph TD
    subgraph EP["Employee Portal"]
        P1[Training Attendance Summary\nPresent · Absent · Excused this period]
        P2[Recent Assessment Scores\nLast 5 scores with competency labels]
        P3[Competency Milestone Progress\nCompletion % by competency area]
        P4[Learning Performance Trend\nLine chart last 3 months]
        P5[Active Interventions\nType · Schedule · Sessions remaining]
        P6[Trainer Feedback\nLatest session notes and comments]
    end
```

---

## Notification Touch-Points — Corporate L&D

```mermaid
sequenceDiagram
    participant SYS as System
    participant TRAINER as Trainer
    participant LDMGR as L&D Manager
    participant LDADMIN as L&D Administrator
    participant EMP as Employee
    participant PLATADMIN as Platform Admin

    Note over SYS: All notifications are organisation-scoped
    SYS->>TRAINER: 🔔 At-risk alert — HIGH competency risk detected
    SYS->>LDMGR: 🔔 Remedial training pending your approval
    SYS->>EMP: 📧 Remedial training session assigned to you
    SYS->>TRAINER: 🔔 Session reminder — 24 hours before training
    SYS->>LDMGR: 🔔 Intervention complete — record competency outcomes
    SYS->>LDADMIN: 📊 Weekly at-risk employee summary
    SYS->>LDADMIN: ⏰ Regulatory compliance deadline — 7 days
    SYS->>LDADMIN: ⚠️ Plan usage at 90 percent — consider upgrading
    SYS->>EMP: 📈 Competency improvement update post-intervention
    SYS->>LDADMIN: 🚨 CRITICAL risk — employee compliance certification at risk
    SYS->>PLATADMIN: 🔴 Tenant provisioning failed — action required
    SYS->>PLATADMIN: 💳 Organisation payment failed — suspension in 7 days
```
