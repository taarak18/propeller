# User Journeys

# User Journeys — SaaS Multi-Tenant

## Role Overview (All Tenant Types)

```mermaid
mindmap
  root((LearnTrack SaaS))
    Platform Admin
      Manage all tenants
      Onboard new customers
      Monitor platform health
      Manage billing and plans
    Tenant Admin
      Configure tenant settings
      Manage users and roles
      Set up SSO
      View compliance reports
    Teacher / L&D Admin
      View class or team dashboard
      Review at-risk learners
      Assign interventions
      Log session attendance
    Counsellor
      Manage caseload
      Approve interventions
      Track learner progress
      Record outcomes
    Parent / Employee
      View own progress
      Track attendance
      Monitor milestone status
      View active interventions
```

---

## Journey 1 — New Customer Onboards as a SaaS Tenant

```mermaid
journey
    title New School or Corporate Signs Up for LearnTrack SaaS
    section Discovery
      Visit learntrack.io marketing site: 5: Prospect
      Compare Starter Pro Enterprise plans: 4: Prospect
      Request a demo: 5: Prospect, Sales
    section Sign Up
      Complete online registration form: 5: Admin
      Select plan and billing cycle: 4: Admin
      Submit payment details: 4: Admin
    section Automated Provisioning
      System creates tenant record: 5: System
      System provisions DB schema: 5: System
      System seeds default rules and templates: 5: System
      System creates admin user account: 5: System
    section Go Live
      Admin receives welcome email with portal URL: 5: Admin, System
      Admin logs in for first time: 5: Admin
      Admin configures branding and timezone: 4: Admin
      Admin invites teachers and counsellors: 4: Admin
      First learner data imported: 4: Admin, System
```

---

## Journey 2 — Platform Admin Manages the SaaS Platform

```mermaid
journey
    title Platform Admin Daily Operations
    section Morning Health Check
      Login to platform admin console: 5: Platform Admin
      View tenant count and status summary: 5: Platform Admin
      Check provisioning jobs in progress: 4: Platform Admin
      Review system-wide error rate and latency: 4: Platform Admin, System
    section Tenant Management
      Review new tenant onboarding requests: 4: Platform Admin
      Approve and trigger provisioning: 5: Platform Admin, System
      Handle tenant suspension for non-payment: 3: Platform Admin
      Process plan upgrade migration job: 4: Platform Admin, System
    section Billing and Usage
      Review metered usage per tenant: 4: Platform Admin
      Generate monthly invoice summary: 4: Platform Admin, System
      Identify tenants approaching plan limits: 4: Platform Admin, System
      Send upgrade nudge notifications: 4: System
```

---

## Journey 3 — Tenant Admin Configures Their Environment

```mermaid
journey
    title Tenant Admin Sets Up School or Corporate Environment
    section Initial Setup
      Login to tenant portal: 5: Tenant Admin
      Upload school or company logo: 4: Tenant Admin
      Set timezone locale and academic calendar: 4: Tenant Admin
      Configure custom domain if Pro or Enterprise: 3: Tenant Admin
    section User Management
      Invite teachers trainers and counsellors: 5: Tenant Admin
      Assign roles to each user: 4: Tenant Admin
      Configure SSO with identity provider if Enterprise: 3: Tenant Admin
      Enable parent or employee portal: 4: Tenant Admin
    section Rule Configuration
      Review default risk rules seeded by system: 5: Tenant Admin
      Customise attendance thresholds for organisation: 4: Tenant Admin
      Test rules against sample learner profiles: 4: Tenant Admin, System
      Activate rules for live evaluation: 5: Tenant Admin
    section First Data Import
      Upload learner roster via CSV: 4: Tenant Admin
      Connect attendance system API: 3: Tenant Admin
      Connect assessment system API: 3: Tenant Admin
      Verify data ingestion and profile generation: 4: Tenant Admin, System
```

---

## Journey 4 — Teacher Identifies and Acts on an At-Risk Learner

```mermaid
journey
    title Teacher Acts on At-Risk Alert
    section Dashboard Review
      Login to tenant portal: 5: Teacher
      View class at-risk summary widget: 5: Teacher
      Receive HIGH risk alert notification: 4: Teacher, System
    section Profile Investigation
      Open at-risk learner profile: 5: Teacher
      Review attendance trend chart last 30 days: 4: Teacher
      Review consecutive failing assessments: 4: Teacher
      Review milestone completion gaps: 3: Teacher
    section Intervention Assignment
      Select recommended intervention type: 4: Teacher
      Set schedule frequency and duration: 4: Teacher
      Submit for counsellor approval: 5: Teacher, System
    section Follow-Up
      Receive approval confirmation: 5: Teacher, System
      Log each session attendance and notes: 4: Teacher
      View mid-intervention progress update: 4: Teacher, System
```

---

## Journey 5 — Parent or Employee Monitors Own Progress

```mermaid
journey
    title Parent or Employee Uses Self-Service Portal
    section Portal Access
      Receive portal invitation email: 5: Parent, System
      Set password and login: 5: Parent
      View personal dashboard: 5: Parent
    section Progress Review
      View attendance summary current period: 5: Parent
      See recent assessment scores with subject labels: 5: Parent
      View milestone completion percentage: 4: Parent
      Review performance trend chart last 3 months: 4: Parent
    section Intervention Awareness
      Receive notification of active intervention: 4: System, Parent
      View intervention schedule and session count: 4: Parent
      Read facilitator session notes: 3: Parent
    section Outcome Update
      View post-intervention improvement charts: 5: Parent, System
      Acknowledge progress update: 4: Parent
```

---

## Role-Based Dashboard Layouts

### Teacher / L&D Admin Dashboard

```mermaid
graph TD
    subgraph TD["Teacher Dashboard — Tenant: Springfield HS"]
        W1[Class Summary\nTotal Learners · At-Risk Count · Avg Score]
        W2[At-Risk Learners List\nSorted by Risk Level with severity badges]
        W3[Subject Performance\nBar chart by subject]
        W4[Attendance Heatmap\nClass calendar view]
        W5[My Active Interventions\nStatus · Sessions remaining]
        W6[Recent Alerts\nNotification feed]
    end
    W2 -->|Click learner| P[Learner Profile\nAttendance · Scores · Milestones · Risk History]
    W5 -->|Click intervention| I[Intervention Detail\nSchedule · Sessions · Outcomes]
```

---

### Tenant Admin Dashboard

```mermaid
graph TD
    subgraph AD["Tenant Admin Dashboard — Tenant: Springfield HS"]
        A1[Organisation KPIs\nTotal Learners · At-Risk % · Avg Attendance]
        A2[Risk Distribution\nPie: Critical · High · Medium · Low]
        A3[Intervention Effectiveness\nSuccess rate by type]
        A4[Compliance Calendar\nUpcoming deadlines · Completion status]
        A5[Plan Usage Meters\nLearners · Rules · API calls · Storage]
        A6[User Activity\nActive users last 30 days]
    end
    A4 -->|Click deadline| RPT[Report Generator]
    A5 -->|Approaching limit| UPG[Plan Upgrade Prompt]
```

---

### Platform Admin Dashboard *(SaaS operator only)*

```mermaid
graph TD
    subgraph PA["Platform Admin Console — LearnTrack Operations"]
        P1[Platform Summary\nTotal Tenants · Active · Suspended · Provisioning]
        P2[Revenue Dashboard\nMRR · ARR · Churn rate]
        P3[Infrastructure Health\nAPI latency · Error rate · DB load]
        P4[Tenant Health Heatmap\nColour-coded by system usage]
        P5[Provisioning Queue\nPending · In-progress · Failed jobs]
        P6[Plan Distribution\nStarter · Pro · Enterprise breakdown]
        P7[Usage Alerts\nTenants near plan limits]
    end
    P4 -->|Click tenant| TD2[Tenant Detail + Usage Breakdown]
    P5 -->|Click job| JD[Provisioning Job Detail + Logs]
```

---

## Notification Touch-Points (Multi-Tenant Aware)

```mermaid
sequenceDiagram
    participant SYS as System
    participant TEACHER as Teacher
    participant COUNSELLOR as Counsellor
    participant ADMIN as Tenant Admin
    participant PARENT as Parent / Employee
    participant PLATADMIN as Platform Admin

    Note over SYS: All notifications are tenant-scoped
    SYS->>TEACHER: 🔔 At-risk alert — HIGH risk detected
    SYS->>COUNSELLOR: 🔔 Intervention pending your approval
    SYS->>PARENT: 📧 Intervention assigned to your learner
    SYS->>TEACHER: 🔔 Session reminder — 24 hours before
    SYS->>COUNSELLOR: 🔔 Intervention complete — record outcomes
    SYS->>ADMIN: 📊 Weekly at-risk summary report
    SYS->>ADMIN: ⏰ Compliance deadline reminder — 7 days
    SYS->>ADMIN: ⚠️ Plan usage at 90 percent — consider upgrading
    SYS->>PARENT: 📈 Progress update post-intervention
    SYS->>ADMIN: 🚨 CRITICAL risk escalation — immediate action
    SYS->>PLATADMIN: 🔴 Tenant provisioning failed — action required
    SYS->>PLATADMIN: 💳 Tenant payment failed — suspension in 7 days
    SYS->>PLATADMIN: 📉 Platform error rate exceeded threshold
```

---

## Tenant Self-Service Upgrade Journey

```mermaid
journey
    title Tenant Admin Upgrades from Pro to Enterprise
    section Trigger
      Receive plan usage alert at 90 percent: 4: Tenant Admin, System
      Click upgrade prompt on dashboard: 5: Tenant Admin
    section Plan Comparison
      View Pro vs Enterprise feature comparison: 5: Tenant Admin
      Review pricing and ROI calculator: 4: Tenant Admin
      Select Enterprise annual plan: 5: Tenant Admin
    section Upgrade Confirmation
      Confirm billing details: 4: Tenant Admin
      Submit upgrade request: 5: Tenant Admin
      Receive upgrade confirmation and migration ETA: 5: Tenant Admin, System
    section Migration
      System provisions dedicated database: 5: System
      System migrates data with zero downtime: 5: System
      System provisions dedicated K8s namespace: 5: System
      System enables enterprise feature flags: 5: System
    section Post-Upgrade
      Tenant Admin receives completion notification: 5: System, Tenant Admin
      Configure SSO with identity provider: 4: Tenant Admin
      Enable ML-based risk scoring: 4: Tenant Admin
      Set up white-label custom domain: 4: Tenant Admin
```
