# Missing elements in corporate learning problem statement
_Exported on 5/28/2026 at 14:16:39 GMT+5:30 from Cursor (3.0.16)_

---

**User**

as a business Analyts suggest what all is missing in D:\pdea\propeller\Propeller_Technothon_Files\Problem_Statement_3_Corporate_Learning\Corporate-Learning-System-Problem-Statement-3.txt

---

**Cursor**

I've reviewed `Corporate-Learning-System-Problem-Statement-3.txt` against the companion judge evaluation sheet and the implementation guide in the same folder. Below is a structured Business Analyst gap analysis.

## Executive Summary

The problem statement (24 lines) reads more like a **one-paragraph brief** than a BA-grade requirements document. It captures *intent* well but leaves ~80% of what an engineering team needs **unsaid or implied**. Worse, the companion `Corporate_Learning_Judge_Evaluation_Sheet.csv` is written for a **K-12 / student / FERPA** context (students, parents, teachers, FERPA, grade-level progression), while the PS itself is **corporate / employee / L&D**. This is a blocking inconsistency.

---

## 1. Critical Inconsistencies (Fix First)

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | Eval sheet talks about *students, parents, teachers, FERPA, grade-level progression, school/district*, but PS is about *employees, trainers, L&D admins, corporate compliance* | `Corporate_Learning_Judge_Evaluation_Sheet.csv` lines 2–9, 43–48, 69–71, 87–90, 143–171 | Judges will score on the wrong rubric |
| 2 | Line 7 (`Competency-level learning milestones`) is missing its list bullet (`3.`) and indentation — it visually escapes its parent list | Line 7 | Ambiguity over whether it's a 3rd ingestion item or a sibling section |
| 3 | Indentation is mixed (tabs vs. spaces); `ii`, `iii`, `iv` under `b.` jump back to a different indent level than `i.` | Lines 8–12 | Hard to parse hierarchy unambiguously |

---

## 2. Missing — Business Context

- **Industry / sector** of the target organization (BFSI, pharma, manufacturing, IT services — each has very different compliance regimes).
- **Organization size** (500? 50,000? 500,000 employees?) — drives architecture.
- **Geography / data residency** (single country, multi-region, EU+US?).
- **Current-state pain quantified** — e.g., "30% of mandatory trainings are completed late," "audit findings cost ₹X last year." No baseline metrics → no ROI story.
- **Business sponsor / decision-maker** identified.
- **Strategic driver** — is this driven by an audit failure, a new regulation, a cost-cutting initiative, or upskilling for a transformation?

---

## 3. Missing — Stakeholders & Personas

The PS only names "trainers and L&D administrators." A real corporate learning system has at minimum:

- **Learner / Employee** (self-service view of own progress) — *not mentioned*
- **People Manager** (visibility into team's compliance) — *not mentioned*
- **L&D Administrator** ✓ mentioned
- **Trainer / SME / Coach / Mentor** — partially implied
- **Compliance Officer / Internal Audit** — implied only
- **External Regulator / Auditor** (consumer of reports) — *not mentioned*
- **HRBP** (HR Business Partner — owns interventions) — *not mentioned*
- **IT / Integration owner** of source LMS — *not mentioned*

No personas, no user journeys, no RACI.

---

## 4. Missing — Scope Clarity (In / Out)

The PS says "*You are not building a full corporate LMS*" — good, but the **out-of-scope list is implicit**. Explicitly clarify whether the following are in or out:

- Content authoring / course delivery / video playback
- Virtual classroom / proctoring
- Certification issuance & badge management
- Learning path / curriculum design
- AI-based recommendations / personalization
- Gamification / leaderboards
- Skill marketplace
- Performance review integration
- Payroll / cost-center charge-back for training spend
- Vendor / external trainer management

---

## 5. Missing — Functional Requirements

The "Must-Have" list is 5 bullets. Major functional gaps:

| Capability | Status in PS |
|---|---|
| User authentication & RBAC (roles, permissions) | **Not mentioned** |
| Notifications & alerts (email, in-app, SMS, MS Teams/Slack) | **Not mentioned** |
| Approval workflow for intervention assignment | **Not mentioned** |
| Manager / supervisor team view | **Not mentioned** |
| Learner self-service portal | **Not mentioned** |
| Bulk upload / manual override of data | **Not mentioned** |
| Audit trail of who-changed-what | Only "compliance-ready reporting" — vague |
| Multi-tenancy / org hierarchy (BU → dept → team) | **Not mentioned** |
| Localization / multi-language | **Not mentioned** |
| Calendar / MS Outlook integration for sessions | **Not mentioned** |
| Reminders / nudges for at-risk learners | **Not mentioned** |
| Exception handling (leave, medical, sabbatical) | **Not mentioned** |

---

## 6. Missing — Non-Functional Requirements (NFRs)

This is the **largest single gap**. The PS has zero NFRs. The evaluation sheet expects them (e.g., P95 API < 200 ms, uptime > 99.5%, sync latency < 1 hour, rule execution < 2 min for 1,000 records, MTTD < 5 min). These targets **must move into the PS** or contestants are being judged on undisclosed criteria.

Required NFR categories:

- **Performance** — response time, throughput, batch SLAs
- **Availability** — uptime %, RTO, RPO
- **Scalability** — concurrent users, employees, events/day, multi-year data volume
- **Security** — auth (SSO/MFA), encryption (at rest / in transit), data masking
- **Privacy** — PII classification, consent, retention, right-to-erasure
- **Accessibility** — WCAG 2.1 AA, screen reader, keyboard nav
- **Compatibility** — supported browsers, mobile responsive, native app?
- **Observability** — logging, monitoring, alerting expectations
- **Backup / DR** — frequency, recovery objectives

---

## 7. Missing — Compliance & Regulatory Specifics

"*Compliance with regulatory bodies and industry standards*" is the most under-specified phrase in the document. Which regimes?

- **SOX** (financial controls training)
- **GDPR / DPDP Act (India) / CCPA** (employee PII)
- **HIPAA** (if pharma/healthcare)
- **OSHA / DGFASLI** (safety training)
- **ISO 27001 / ISO 9001 / ISO 45001**
- **RBI / SEBI / IRDAI** mandates (if BFSI)
- **Pharma — 21 CFR Part 11** (GxP training records, e-signatures)
- **DEI / POSH** (sexual harassment training in India — mandatory annual)
- **Internal SOPs** vs. external regulator reporting

Each implies different **report formats, retention periods (often 5–7 years), and e-signature requirements**.

---

## 8. Missing — Data & Integration Spec

PS says "Ingestion of (API)" — but does not specify:

- **Source systems** (Cornerstone, SuccessFactors, Workday Learning, Moodle, Degreed, Coursera for Business, Udemy Business, internal LMS?)
- **Integration pattern** — push vs. pull, webhook vs. polling, real-time vs. batch
- **Data format** — REST/JSON, SOAP, SCORM, xAPI/Tin Can, cmi5, CSV/SFTP
- **Frequency / SLA** for sync
- **Master data dependencies** — employee master (HRIS), competency framework, job-role-to-skill mapping, training catalog
- **Data volumes** — # employees, # training events/year, # assessment attempts
- **Historical depth** required at go-live
- **Reconciliation** and **deduplication** rules
- **Data quality** rules (mandatory fields, valid ranges)
- **Sample payloads** / mock API contracts — *none provided*
- **Sample / seed dataset** for contestants — *none provided*

---

## 9. Missing — Rule Engine Spec

"*Rule-based risk identification (Define Rule definition format)*" — the burden of defining the format is pushed to the contestant, but the PS gives no guardrails:

- Are rules **simple thresholds**, **composite (AND/OR/NOT)**, **time-windowed (last 30 days)**, **trend-based (declining 3 quarters in a row)**, or **ML-based**?
- **Who authors** rules — admin via UI, or developer via code?
- **Rule lifecycle** — draft → review → approve → publish → version → retire
- **Rule audit trail** & rollback
- **Rule testing / simulation** before activation
- **Rule library** — is a minimum starter set expected? (Eval sheet says "15+ rules" — not in PS)
- **Conflict resolution** when multiple rules fire
- **Risk scoring vs. binary flagging**

A small **DSL example** in the PS would prevent wildly divergent submissions.

---

## 10. Missing — Intervention Workflow Detail

The PS lists only two intervention types (remedial sessions, coaching). Missing:

- **Taxonomy of interventions** — peer learning, micro-learning, mandatory retake, manager 1:1, PIP, certification deadline extension, etc.
- **Trigger → Action → Owner → SLA → Closure → Outcome** lifecycle
- **Escalation path** if intervention is not picked up
- **Effectiveness measurement** — pre/post score delta, behavioural change, time-to-recover
- **Cost tracking** per intervention
- **Linkage** to performance management / IDP (Individual Development Plan)

---

## 11. Missing — Reporting & Dashboard Spec

"*Simple dashboards or reports*" is one line. Missing:

- **Concrete report list** — e.g., Monthly Compliance Dashboard, Audit-Ready Statutory Report, Manager Team Heatmap, Learner Risk Watchlist, Intervention Outcome Report
- **Format** — PDF, Excel, CSV, embedded BI, API export
- **Frequency** — real-time, daily, monthly, on-demand
- **Recipient list & distribution** (email schedule? portal? regulator portal upload?)
- **Drill-down expectations**
- **Print / regulator-template** compliance (some regulators dictate exact PDF formats)
- **Watermarking, digital signature, version locking** of submitted reports

---

## 12. Missing — Glossary / Domain Terms

Terms used loosely without definition:

- **Competency** vs. **skill** vs. **capability** vs. **milestone**
- **At-risk** — quantified threshold?
- **Intervention** — formal definition & taxonomy
- **Mandatory** vs. **recommended** training
- **Compliance training** vs. **L&D training**
- **Assessment** — pass/fail? scored? formative/summative?

---

## 13. Missing — Constraints & Assumptions

- **Tech stack** constraints / preferences (open source only? specific cloud?)
- **Build vs. buy** posture
- **Budget / cost** envelope (cloud spend, license)
- **Timeline / milestones** (hackathon duration, demo date)
- **Team composition** assumptions
- **Existing infrastructure** to integrate with
- **Licensing constraints** on data / content

---

## 14. Missing — Deliverables & Submission

For a hackathon/technothon problem statement, contestants need to know:

- **What to submit** — source code, deployed URL, video demo, architecture deck, runbook
- **Tech stack constraints / freedom**
- **Submission format** & repo structure
- **Demo duration** & format
- **Judging mechanics** (live demo vs. async eval)

---

## 15. Missing — Evaluation Detail

The PS lists 4 evaluation parameters (lines 19–23) but:

- **No weights** (the CSV has weights — they should be visible upfront)
- **No rubric levels** (what's a "5/5" vs. "3/5" for "Realism of learning competency rules"?)
- **No minimum bar** for qualification
- The 4 PS parameters **don't reconcile** with the 180+ rows in the eval CSV — contestants don't know which ones are primary

---

## 16. Missing — Sample Artefacts

For a fair, executable contest, attach:

- Sample employee dataset (anonymized, ~1,000 records)
- Sample LMS attendance feed (JSON/CSV)
- Sample assessment results feed
- Sample competency framework (roles × skills × levels)
- Sample rule definition (1–2 worked examples)
- Sample intervention catalog
- Sample regulator report template (PDF/Excel)

---

## Recommended Next Steps

1. **Reconcile the eval sheet** — replace student/FERPA/teacher terms with employee/DPDP/trainer terms, or repurpose the eval sheet entirely.
2. **Expand the PS to ~4–6 pages** with the missing sections above. Suggested structure: *Context → Stakeholders → Scope (In/Out) → Functional Requirements → NFRs → Compliance → Data & Integration → Rule DSL → Intervention Workflow → Reporting → Deliverables → Evaluation Rubric → Glossary → Sample Data Annex.*
3. **Publish sample datasets and mock APIs** alongside the PS so every contestant builds against the same shape of data.
4. **Surface the NFR targets** that the judges will measure (uptime, P95, sync latency, rule execution time, etc.) — currently hidden in the CSV.
5. **Fix the formatting glitch on line 7** (`Competency-level learning milestones`) so the hierarchy is unambiguous.
6. **Add a one-page persona + journey** for L&D admin, learner, and manager — this single addition tends to align 80% of design decisions.

If you'd like, I can draft the **expanded problem statement** in markdown using the structure above, or produce a **requirements traceability matrix** mapping every eval-sheet row back to a PS requirement so the gap is visible at a glance.

---

**User**

D:\pdea\propeller\Propeller_Technothon_Files\Problem_Statement_3_Corporate_Learning\Corporate-Learning-System-Problem-Statement-3.txt. Do not refer any other doc from the project/folder. Consider only generic business analysts role.

---

**Cursor**

Here is a clean, generic Business Analyst gap analysis of `Corporate-Learning-System-Problem-Statement-3.txt` — assessed **only against standard BA requirements-elicitation practice**, without reference to any other file in the folder.

## Verdict in One Line

The document captures **business intent** but lacks the **structure, specificity, and measurability** a BA needs to convert it into a buildable, testable, and acceptance-verifiable requirement set. It is a "brief," not a "requirements document."

---

## 1. Document Hygiene Issues (visible on the page)

| # | Issue | Line(s) | Fix |
|---|---|---|---|
| 1 | Line 7 (`Competency-level learning milestones`) is missing its list bullet (`3.`) and is dedented out of its parent list — it visually escapes the "Ingestion of (API)" group | 4–7 | Re-number as `3.` and align indentation with siblings |
| 2 | Inconsistent indentation between roman numerals under `b.` — `i.` is indented deeper than `ii./iii./iv.` | 4, 8, 9, 12 | Normalize to a single hierarchy level |
| 3 | No document metadata: **version, author, date, owner, status, approvers, change history** | — | Add a header block |
| 4 | No table of contents / section IDs for traceability | — | Number sections (e.g., REQ-001) |
| 5 | Mixed tabs and spaces in indentation | throughout | Standardize |

---

## 2. Missing — Business Context & Background

- **Why now?** — trigger event, business driver, strategic alignment
- **As-Is vs To-Be** — current state described qualitatively only ("detected too late"), no baseline metrics
- **Quantified pain points** — e.g., audit failure rate, training completion %, cost of non-compliance
- **Business case / ROI** — expected benefit, payback period
- **Strategic objective alignment** — which corporate goal does this support?

---

## 3. Missing — Stakeholders

The PS mentions only "trainers and L&D administrators" (line 22). A BA-grade document needs:

- **Stakeholder register** — name/role, interest, influence, RACI
- **Project sponsor** — who funds and owns the decision
- **End users** — learners, line managers, HR, compliance officers, auditors, external regulators
- **System owners** of source/upstream systems
- **Approvers & sign-off authority**
- **Personas** with goals, frustrations, success criteria
- **User journeys** for each persona

---

## 4. Missing — Goals, Objectives & Success Metrics

The document states what to build but **never says what success looks like**. A BA must define:

- **SMART business objectives** (Specific, Measurable, Achievable, Relevant, Time-bound)
- **KPIs / OKRs** with **baseline** and **target** values (e.g., "reduce late detection from 60 days to 14 days")
- **Critical success factors**
- **Benefit realization plan** — when and how each benefit is measured post-launch

---

## 5. Missing — Scope Definition

The "Scope" section lists **what's in** (partially) but:

- **No explicit OUT-of-scope list** — only an inline parenthetical ("not building a full corporate LMS"). What does "full LMS" exclude? Content authoring? Video delivery? Certification issuance? Learning paths? Vendor management? — leave nothing implied.
- **No phasing / MVP vs future** roadmap
- **No geographic / organizational scope** — which entities, BUs, regions are covered at go-live?
- **No transition scope** — historical data migration in / out?

---

## 6. Missing — Functional Requirements (Detail Depth)

The "Must-Have" list (lines 13–18) is **five high-level bullets**. Each needs:

- **Unique requirement ID** (e.g., FR-001)
- **Description, actor, trigger, pre-conditions, post-conditions**
- **Business rules** governing the requirement
- **Acceptance criteria** (Given / When / Then or pass/fail)
- **Priority** (MoSCoW: Must / Should / Could / Won't)
- **Dependencies** between requirements

Functional gaps not even named in the PS:

- **Authentication, authorization, RBAC** — who sees what
- **User onboarding / provisioning / de-provisioning**
- **Notifications & alerts** (channel, frequency, opt-in)
- **Approval / workflow rules** for interventions
- **Audit logging** of user actions
- **Data correction / override** procedures
- **Search, filter, sort, export**
- **Bulk operations & manual entry**
- **Exception handling** (leave, medical, transfers)

---

## 7. Missing — Non-Functional Requirements (NFRs) — ENTIRELY ABSENT

This is the single biggest gap. A BA document **must** quantify:

| NFR Category | Examples Needed |
|---|---|
| **Performance** | response time SLA, throughput, batch window |
| **Availability** | uptime %, planned maintenance window |
| **Scalability** | # users, # employees, # events/day, growth horizon |
| **Reliability** | RTO, RPO, error budget |
| **Security** | auth standards (SSO/MFA), encryption, threat model |
| **Privacy** | PII handling, consent, retention, right-to-erasure |
| **Compliance** | applicable regulations (named, not implied) |
| **Usability** | task completion time, learnability target |
| **Accessibility** | WCAG level, assistive-tech support |
| **Portability / Compatibility** | browsers, devices, OS |
| **Maintainability** | code quality, modularity expectations |
| **Observability** | logging, monitoring, alerting |
| **Localization** | languages, time zones, currencies |
| **Backup / DR** | frequency, retention, recovery testing |

The PS does not contain a single quantified NFR.

---

## 8. Missing — Compliance Specifics

Line 2 says "*compliance with regulatory bodies and industry standards*" — too vague. A BA must enumerate:

- **Which regulations apply** (named — internal SOPs, statutory, industry-specific)
- **Retention periods** mandated
- **Audit trail requirements** (immutable? e-signature? time-stamped?)
- **Report templates** prescribed by regulators
- **Submission cadence and channel** (portal upload, email, API)
- **Data residency / cross-border** restrictions

---

## 9. Missing — Data Requirements

- **Conceptual / logical data model** (entities, attributes, relationships)
- **Data dictionary** — definitions for every key term
- **Source systems** to integrate with (names, owners, contacts)
- **Data volumes** — current and projected
- **Data quality rules** — completeness, validity, uniqueness
- **Master data dependencies** (employee master, org hierarchy, competency framework)
- **Reference data** governance (lookup lists, code values)
- **Data classification** (public / internal / confidential / restricted)
- **Data retention & archival** policy

---

## 10. Missing — Integration Requirements

Line 4 says "Ingestion of (API)" but nothing else:

- **Integration pattern** — push vs. pull, real-time vs. batch, event-driven
- **Protocols & formats** (REST, SOAP, file transfer, message queue)
- **Frequency & SLA** for each interface
- **Idempotency, retry, error-handling** expectations
- **Outbound integrations** — does the system push data anywhere? (downstream BI? regulator portal? HRIS?)
- **Interface contracts** / sample payloads

---

## 11. Missing — Business Rules Catalog

Line 8 says "Rule-based risk identification (Define Rule definition format)" — the BA is **pushing rule definition to the implementer**, which is backwards. The BA owes:

- **Rule taxonomy** — threshold, composite, trend, time-windowed, ML
- **Worked examples** — at least 3–5 concrete real-world rules
- **Rule ownership** — who authors, reviews, approves, retires
- **Rule lifecycle** — draft → tested → approved → live → versioned → retired
- **Conflict-resolution policy** when rules overlap
- **Tolerance / exception handling**
- **Effective dating** (rule starts/ends on date X)

---

## 12. Missing — Process & Workflow

- **As-Is process maps** for current learning/intervention workflow
- **To-Be process maps** showing the system's role
- **State diagrams** — e.g., learner state (compliant → at-risk → intervention assigned → recovered)
- **Intervention lifecycle** — trigger → assignment → execution → outcome → effectiveness review
- **SLA for each workflow step** & escalation paths

---

## 13. Missing — Reporting & Analytics Spec

Line 18 says only "*Simple dashboards or reports*". Required:

- **Report catalog** (name, purpose, audience, frequency, format, distribution)
- **Mandatory KPIs and metrics** to be surfaced
- **Drill-down / slice-and-dice** requirements
- **Export formats** (PDF, Excel, CSV, API)
- **Self-service vs. canned**
- **Historical / trend views** required
- **Real-time vs. periodic** refresh

---

## 14. Missing — Glossary / Definitions

Undefined terms used loosely:

- **Competency** vs. **skill** vs. **capability** vs. **milestone**
- **At-risk** — what threshold qualifies?
- **Intervention** — formal taxonomy
- **Mandatory** vs. **recommended** training
- **Assessment** — formative? summative? proctored?
- **Compliance** vs. **completion**
- **Learning outcome**

A BA document should have a glossary section.

---

## 15. Missing — Assumptions, Constraints, Dependencies, Risks (ACDR)

Standard BA artifact — absent:

- **Assumptions** being made (e.g., "all source systems expose REST APIs")
- **Constraints** (tech stack, budget, timeline, regulatory)
- **Dependencies** on other projects, teams, vendors
- **Risk register** — risk, probability, impact, owner, mitigation, contingency

---

## 16. Missing — Acceptance Criteria & UAT Approach

- **System-level acceptance criteria** (definition of done for the project)
- **Per-requirement acceptance criteria**
- **UAT scenarios & test data** approach
- **Go/no-go criteria** for launch

---

## 17. Missing — Evaluation Rubric Detail

Lines 19–23 list 4 evaluation parameters but:

- **No weights** per parameter
- **No rubric levels** (what is "good" vs. "excellent" for each?)
- **No measurement method** — how is "Realism" or "Practical usefulness" assessed objectively?
- **No minimum threshold** for acceptance
- **No evaluators / panel composition** disclosed

---

## 18. Missing — Governance & Change Management

- **Decision-making forum / RACI**
- **Change-request process** during build
- **Sign-off workflow**
- **Training & rollout plan**
- **Communications plan**

---

## 19. Missing — Supporting Artefacts a BA Normally Attaches

- Context diagram
- Use-case diagrams
- Activity / swim-lane diagrams
- Data flow diagrams
- Conceptual data model (ERD)
- Wireframes / mockups
- Sample input/output data
- Traceability matrix (objective → requirement → test case)

---

## Priority Fix List (if you can do only 8 things)

1. Add **document metadata** (version, author, date, owner).
2. Fix **line 7 formatting**.
3. Add **measurable objectives & KPIs** (baseline → target).
4. List **out-of-scope** items explicitly.
5. Add a **stakeholder register** with at least 6 named roles.
6. Add a **quantified NFR section** (performance, availability, security, compliance, retention).
7. Enumerate **applicable regulations** instead of "regulatory bodies and industry standards."
8. Provide **2–3 worked examples** of risk rules and a rule-definition template, plus a **glossary** of the 6–8 ambiguous terms.

---

## Maturity Score (BA perspective)

| Dimension | Score (1–5) | Comment |
|---|---|---|
| Clarity of intent | 4 | Reader understands what is wanted at a high level |
| Specificity | 1 | Almost no concrete numbers or rules |
| Measurability | 1 | No KPIs, NFRs, or acceptance criteria |
| Completeness | 1 | Missing 60–70% of standard BA sections |
| Traceability | 1 | No IDs, no rubric weights, no test mapping |
| Stakeholder coverage | 2 | Only two roles named |
| Risk / assumption transparency | 1 | None documented |
| **Overall** | **~1.5 / 5** | Suitable as a **kick-off brief**, not as a **build-ready BRD/SRS** |

If helpful, I can produce a **rewritten, BA-grade version** of this same problem statement using the structure above — same intent, but build-ready.

---

**User**

what are the available options for implemenating rulengine ? One is Drools, but its very heavy framework. What are the avaiable chaoices ?

---

**Cursor**

Checking whether the project already references a rule-engine approach, then summarizing practical options.


For your corporate-learning use case (attendance %, score thresholds, competency milestones, composite “at-risk” rules), you do not need a full BRMS like Drools unless rules become very large, highly dynamic, or need legal-grade decision audit out of the box.

Below is a practical map of **choices**, from lightest to heaviest.

---

## 1. Custom rule evaluator (no framework)

**What:** Store rules as JSON/YAML (or DB rows); your app loads them and evaluates conditions in code.

**Example shape:**
```json
{
  "id": "RISK_ATTENDANCE_LOW",
  "when": { "all": [
    { "field": "attendancePct", "op": "lt", "value": 80 },
    { "field": "trainingType", "op": "eq", "value": "MANDATORY" }
  ]},
  "then": { "riskLevel": "HIGH", "reason": "Low mandatory attendance" }
}
```

**Pros:** Smallest footprint, full control, easy for hackathons, matches “define rule format” in your PS.  
**Cons:** You build versioning, testing UI, conflict resolution, and complex logic (trends, dates) yourself.

**Best when:** ~15–50 rules, mostly thresholds and AND/OR, L&D admins configure via UI.

---

## 2. Expression engines (evaluate one rule at a time)

You keep rules in config/DB; each rule’s **condition** is a string expression.

| Option | Ecosystem | Notes |
|--------|-----------|--------|
| **SpEL** (Spring) | Java | Native in Spring apps; good for `attendancePct < 80 && mandatory` |
| **MVEL** | Java | Older; still used in some rule tools |
| **Aviator** | Java | Fast, sandboxed expressions; popular for fintech-style rules |
| **JEXL** (Apache Commons) | Java | Simple boolean/math expressions |
| **FEL** | Java | Lightweight expression language |
| **Microsoft RulesEngine** | .NET | JSON workflow rules, very popular for .NET microservices |
| **json-rules-engine** | Node.js | Event/fact based, JSON rules, small API |
| **python-rule-engine** / simple `eval` avoided | Python | Prefer safe DSL, not raw `eval` |

**Pros:** Light, readable rules for admins if you wrap with a UI.  
**Cons:** Complex rules (chains, agendas, salience) get messy; you still own orchestration.

**Best when:** Rules are mostly “if expression then outcome.”

---

## 3. Lightweight “rules libraries” (middle ground)

| Library | Stack | Weight vs Drools |
|---------|--------|------------------|
| **Easy Rules** | Java | Much lighter; Java objects + annotations or YAML |
| **NRules** | .NET | Rete-like but smaller than Drools; code-first rules |
| **node-rules** | Node.js | Forward-chaining, JSON-ish rules |
| **experta** | Python | Expert-system style (clips-like), medium weight |
| **business-rules** | Python | Decorator-based, simple predicates |

**Pros:** Named “rule engine” without KIE/Drools ops burden.  
**Cons:** Less tooling than Drools; scaling to hundreds of interdependent rules needs discipline.

**Best when:** You want a real engine API but not a BRMS deployment.

---

## 4. Decision Model and Notation (DMN) — standards-based, still lighter than full Drools

**What:** Decision tables in XML/JSON; engines evaluate inputs → outputs.

| Engine | Notes |
|--------|--------|
| **Camunda DMN** | Often used with Camunda BPM; can run DMN standalone |
| **Kogito / Drools DMN** | Drools ecosystem but you can use **DMN only** (smaller surface than DRL) |
| **dmn-js + custom runner** | FE editing; backend evaluates |

**Pros:** Business-friendly tables (“if attendance 0–79 → HIGH”); good for compliance reporting.  
**Cons:** DMN tooling learning curve; composite logic across many tables needs design.

**Best when:** L&D/compliance teams think in **decision tables**, not code.

---

## 5. Full BRMS / enterprise rule engines (heavy)

| Product | Typical use |
|---------|-------------|
| **Drools / KIE** | Large rule bases, Rete optimization, complex agendas |
| **IBM ODM** | Enterprise, mainframe/integration |
| **FICO Blaze Advisor** | Credit/risk industries |
| **OpenL Tablets** | Excel-like tables → rules (lighter than Drools for table fans) |

**Pros:** Mature versioning, RETE, rule flows, audit.  
**Cons:** Heavy runtime, ops, skill set; overkill for a tracking layer on top of LMS data.

**Best when:** Hundreds/thousands of rules, frequent rule changes by non-devs, strict audit requirements.

---

## 6. Workflow / policy engines (often confused with rule engines)

| Tool | Role |
|------|------|
| **Camunda / Temporal / Airflow** | **Process** orchestration (assign coach → wait → reassess) |
| **OPA (Open Policy Agent)** | **Policy** (authz, allow/deny), Rego language |
| **AWS EventBridge / Azure Logic Apps** | Event routing, not deep business rules |

Use these **alongside** a rule engine: rules decide *at-risk*; workflow drives *intervention steps*.

---

## 7. Database-driven rules (common in L&D/compliance products)

**What:** `rules` table: `metric`, `operator`, `threshold`, `scope`, `priority`, `effective_from`.

**Pros:** No extra dependency; easy admin UI; audit in DB.  
**Cons:** Trend rules (“3 declining scores”) and nested logic need extra columns or a small DSL.

**Best when:** MVP and most rules are numeric thresholds — very common for your PS.

---

## 8. Low-code / cloud rule services

| Service | Fit |
|---------|-----|
| **Azure Logic Apps / Power Automate** | Simple if/then on events |
| **AWS Step Functions + Choice states** | Branching, not rich rule DSL |
| **Google Cloud Workflows** | Same idea |

Usually **not** ideal as the core competency-risk engine; better for notifications and integrations.

---

## How to choose (for your problem statement)

| Your need | Lean toward |
|-----------|-------------|
| Attendance % & score thresholds | **Custom JSON rules** or **DB rules** + SpEL/Aviator |
| L&D admin configures without coding | **JSON/YAML DSL + UI** or **DMN tables** |
| AND/OR composite risk | **json-rules-engine**, **Easy Rules**, or custom `all`/`any` tree |
| Rule versioning & audit | **DB + version column** or **DMN** / light BRMS |
| Trend / time windows (“last 30 days”) | Custom evaluator or expression engine with date functions |
| Hackathon / small team | **Avoid Drools** — custom DSL or **Microsoft RulesEngine** / **json-rules-engine** |
| Java Spring stack | **SpEL** or **Aviator** + JSON config |
| .NET stack | **Microsoft RulesEngine** |
| Node stack | **json-rules-engine** |

---

## Practical recommendation (lightweight stack)

A pattern that fits your PS well and stays far lighter than Drools:

1. **Rule storage:** JSON/YAML in DB (with version, effective dates, tenant id).  
2. **Rule model:** `conditions` (tree of AND/OR) + `actions` (set risk level, tags, notify).  
3. **Execution:** Single pass over employee profiles — evaluate all active rules, aggregate highest risk.  
4. **Optional:** SpEL/Aviator only for **complex** conditions; keep simple rules in structured JSON (no strings to parse).  
5. **Separate:** Camunda/Temporal only if you need **intervention workflow**, not for threshold rules.

That gives you “configurable risk rules” and “clean separation of data, rules, reporting” without a 50 MB rule runtime.

---

## Quick comparison

| Approach | Complexity | Configurable by L&D | Good for composite rules |
|----------|------------|---------------------|---------------------------|
| Custom JSON DSL | Low | Yes (with UI) | Yes (with design) |
| Expression engine | Low–Med | Partial | Yes |
| Easy Rules / json-rules-engine | Med | Partial | Yes |
| DMN | Med | Yes (tables) | Yes |
| Drools DRL | High | Hard | Excellent |
| Full BRMS | Very high | Yes (with tooling) | Excellent |

---

If you share your **target stack** (Java/Spring, .NET, Node, Python) and whether rules must be edited **only via UI** or also checked into Git, I can narrow this to 2–3 concrete options with a sample rule format for each. I'm in Ask mode, so I can only advise — switch to Agent mode if you want a rule schema or spike implementation in the repo.

---

**User**

Add. the above details of rules engine decision and comparison. We will go with the first option of custom JSON DSL based rules. A sample Json in present in D:\pdea\propeller\Propeller_Technothon_Files\Problem_Statement_3_Corporate_Learning\Corporate_Learning_System_Implementation_Guide.md. Can you think of other such rules with different conditions, criteria & actions to cover different risk scenarios in the problem statement. Please add these to a seperate md doc with clear explaination. 

---

**Cursor**

Reviewing the sample JSON rule format in the implementation guide, then drafting the markdown document content (Ask mode prevents creating files).


I'm in **Ask mode**, so I can't create files in your repo. Below is the full markdown you can save as something like:

`Propeller_Technothon_Files/Problem_Statement_3_Corporate_Learning/Corporate_Learning_Risk_Rules_Engine.md`

Switch to **Agent mode** if you want this written to disk automatically.

---

```markdown
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

### RISK_CORP_011 — Multiple competency gaps (OR group)

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

### RISK_CORP_014 — Low attendance on compliance training only (OR scope)

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

### RISK_CORP_015 — Optional upskilling neglect (LOW — watchlist)

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
```

---

## Summary

| Item | Detail |
|------|--------|
| **Decision** | Custom JSON DSL (not Drools) |
| **Baseline rule** | `RISK_CORP_001` — adapted from the guide’s attendance example |
| **Additional rules** | 14 more (`RISK_CORP_002`–`015`) covering assessment, trends, milestones, composite, compliance deadlines, intervention outcomes, certification, onboarding, recurrence, and workflow overdue |
| **File to create** | e.g. `Corporate_Learning_Risk_Rules_Engine.md` under `Problem_Statement_3_Corporate_Learning/` |

Switch to **Agent mode** and ask to “create `Corporate_Learning_Risk_Rules_Engine.md` from the draft above” if you want this saved in the repo automatically.

---

**User**

Please write this in the md file

---

**Cursor**

Created the document at:

**`Propeller_Technothon_Files/Problem_Statement_3_Corporate_Learning/Corporate_Learning_Risk_Rules_Engine.md`**

It includes:

1. **Rules engine decision** — custom JSON DSL vs Drools and other options  
2. **Comparison table** of alternatives  
3. **JSON schema** — fields, operators, metrics, actions  
4. **Baseline rule** `RISK_CORP_001` (adapted from the implementation guide)  
5. **14 additional rules** (`RISK_CORP_002`–`015`) with business intent and PS traceability  
6. **Coverage matrix**, execution notes, and problem-statement traceability table

---

**User**

Review the L&D system architecture in the location D:\pdea\propeller\L-D\.sasva\overview. List the gaps in the architecture, Improvements, tech stack

---

**Cursor**

I've reviewed all six files in `D:\pdea\propeller\L-D\.sasva\overview\`. The architecture is broadly solid (multi-tenant isolation tiers, event-driven microservices, per-service DBs, tenant-context caching), but I see roughly 30 gaps across architecture, data, ops, compliance, and tech-stack discipline. Before I draft the review document, two clarifying choices.

> **How deep should the review go?**
> - Executive snapshot (1 page) - top 10 gaps, top 5 improvements, stack risks
> - Full BA-grade review (multi-section) - all gaps + ranked improvements + concrete tech-stack recommendations with rationale
> - Full review + a proposed revised target architecture (Mermaid diagrams + sequence updates)
>
> Answer: review as Senior techinal architect with a wholistic view

> **Where should I write the review?**
> - New file in same folder: L-D/.sasva/overview/06-architecture-review.md
> - L-D/ARCHITECTURE_REVIEW.md (one level up, more visible) ✔
> - Append a 'Gaps & Improvements' section to each existing file (00-05) instead of a new doc

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Review document created at `L-D/ARCHITECTURE_REVIEW.md`.

## What was delivered

A single, holistic Senior Technical Architect review covering all six source documents, with:

- **Executive verdict** — maturity scorecard across 8 dimensions, weighted to an overall **2.9 / 5** (strong vision, medium depth).
- **What is good (keep)** — 9 patterns worth preserving.
- **Gap analysis across 5 surfaces** — architecture (10), data & integration (9), security/compliance (8), reliability/ops (7), product/domain (8). Each gap cites source file + line numbers.
- **Tech-stack rationalisation** — risks table, recommended single-stack baseline (Spring Boot or FastAPI, React + TypeScript + Vite, ApexCharts, Kong, Istio, Temporal, Debezium, ClickHouse, OpenTelemetry + Sentry, per-tenant KMS, S3 Object Lock, DocuSign, etc.), and a trim list.
- **Prioritised roadmap** — 10 × P0 (MVP-blocking), 10 × P1 (pre-first-Enterprise-tenant), 10 × P2 (scale phase), with suggested owners.
- **10 open questions** for the architecture board.
- **4 Mermaid diagrams** in Appendix A:
  1. Corrected data-ownership boundary (resolves Ingestion vs Profile conflict)
  2. Outbox + DLQ + retry event flow
  3. Tenant provisioning saga state machine with compensations
  4. CQRS / CDC read-model pipeline to reporting-db / search / warehouse
- **Findings index** for quick reference.

## Top three blocking issues called out

1. **Doc-to-doc contradiction:** `01-architecture.md` and `02-database.md` disagree on which service owns `training_attendance` / `assessment_records`.
2. **Missing reliability primitives:** no transactional outbox, no DLQ/retry strategy, no idempotency keys, no provisioning saga — these are the single biggest production risk.
3. **Stack indecision:** three backends + three frontends + three charting libs against a 20-week timeline is a velocity tax that must be resolved by ADR.

No linter errors. All four plan todos completed.

---

**User**

Implement @ArchitecturePrompts.md 

---

**Cursor**

Before I begin writing six updated architecture documents, I need to confirm a handful of decisions that would significantly affect the content. Making wrong assumptions here would mean rewriting large sections.

> **Primary backend language for domain microservices (the review recommends picking one)?**
> - Spring Boot 3 (Java 21) — larger team skill set, mature JVM ecosystem ✔
> - FastAPI (Python 3.12) — faster for data/ML tasks, lighter containers
> - Keep all three (Spring Boot + FastAPI + ASP.NET Core) — accept velocity risk

> **Primary frontend framework?**
> - React 18 + TypeScript + Vite + shadcn/Tailwind ✔
> - Angular 17 + TypeScript
> - Vue 3 + TypeScript

> **Cloud strategy — affects API gateway, KMS, object storage choices**
> - AWS primary (with cloud-agnostic abstractions) ✔
> - Azure primary (with cloud-agnostic abstractions)
> - Truly cloud-agnostic — use open-source tools only (Kong, MinIO, Vault), deployable anywhere

> **Workflow engine for tenant provisioning sagas and intervention lifecycle?**
> - Temporal — code-first (Java/Python SDK), strong saga support ✔
> - Camunda 8 — BPMN-first, visual process designer, good for L&D admins to see flows
> - Defer — simple state machine in DB for MVP, workflow engine in P1

> **Analytics / OLAP store for trend reporting and future ML risk scoring?**
> - ClickHouse — self-hosted, low cost, extremely fast for OLAP
> - Snowflake — fully managed, higher cost, zero ops
> - Defer OLAP — PostgreSQL + materialised views sufficient for MVP scope
>
> Answer: Go for option C, but add a future scope in the doc for prod level analytics

Confirmed. Now I'll create all six updated architecture documents in `D:\pdea\propeller\architecture\` preserving original filenames.

**Decisions locked:**
- Backend: Spring Boot 3 / Java 21 (sole primary)
- Frontend: React 18 + TypeScript + Vite + shadcn/Tailwind
- Cloud: AWS primary with cloud-agnostic abstractions
- Workflow engine: Temporal
- Analytics: PostgreSQL + materialised views (MVP); ClickHouse/Snowflake as future scope

All six updated architecture documents are written. Here is what was delivered:

---

## Summary of all files created

| File | Size | Key additions over v1.0 |
|---|---|---|
| `architecture/00-executive-summary.md` | 13.9 KB | Consolidated stack (Spring Boot 3 + React 18), Temporal, Consent Service, right-to-erasure, compliance scope (US/Canada/EU/India), OLAP future scope |
| `architecture/01-architecture.md` | 19.2 KB | Fixed data ownership boundary, outbox+DLQ diagram, JWKS-local JWT flow, BFF layer, WebSocket/SSE, Istio policy defaults, Consent Service, hash-chained Audit Service, human-review gate |
| `architecture/02-database.md` | 20.6 KB | Corrected schema ownership, `CONSENTS` and `DATA_ERASURE_REQUESTS` tables, `RISK_REVIEWS` table, PII classification policy, outbox table DDL, OLAP future-scope section with materialised views for MVP |
| `architecture/03-technical-flows.md` | 19.9 KB | Temporal provisioning saga with compensation, JWKS-local JWT flow, idempotent ingestion, human-review gate in risk flow, Temporal intervention workflow, CDC-backed reporting flow, right-to-erasure saga, consent opt-out flow, plan upgrade saga |
| `architecture/04-user-journeys.md` | 18.0 KB | Consent capture journey, right-to-erasure journey, human-review gate in Trainer journey, WCAG 2.1 AA accessibility notes throughout all portals, WebSocket live alerts in dashboards |
| `architecture/05-deployment.md` | 21.1 KB | AWS EKS primary, compliance region pinning table (EU/India/US/Canada), OpenTelemetry unified stack (OTel → Prometheus + Tempo + Loki + Sentry), Unleash feature flags, FinOps/Kubecost cost-per-tenant, pgBackRest + Velero backups, DR failover runbook, updated 20-week Gantt |

Original files in `L-D/.sasva/overview/` are untouched.

---

**User**

Please create cursor rules based on the learning and architecture for the Corporate Learning system under .cursor\rules.  Ask for confirmation and don't make any assumptions

---

**Cursor**

Good. Before creating any files, I need to confirm the scope with you. Based on the full architecture (multi-tenant SaaS, Spring Boot 3, React 18, Kafka + outbox, Temporal sagas, risk rules DSL, compliance obligations), here is a proposed set of focused rules.

> **Which rules should I create? (select all that apply)**
> - 01 — Project overview (always-apply): what the system is, key tech decisions, do-not-violate boundaries ✔
> - 02 — Multi-tenant data access (always-apply): always include tenant_id, never cross-tenant, RLS enforcement ✔
> - 03 — Spring Boot service conventions (*.java): outbox pattern, service structure, idempotency, logging with OTel ✔
> - 04 — Kafka / event contracts (*.java, *.proto): outbox-first publish, Protobuf schemas, DLQ handling, idempotent consumers ✔
> - 05 — Risk rules DSL (*.json, *.yaml in rules/): rule schema, required fields, human-review flag for CRITICAL rules ✔
> - 06 — React / TypeScript frontend (*.tsx, *.ts): React 18 + Vite + shadcn patterns, ApexCharts default, accessibility WCAG 2.1 AA ✔
> - 07 — REST API design (*.java controllers): Idempotency-Key header, OpenAPI annotations, error response shape, tenant header forwarding ✔
> - 08 — Security & PII (*.java): no secrets in code, encrypt PII columns, consent check before risk profiling, erasure-aware queries ✔
> - 09 — Compliance guardrails (always-apply): GDPR/DPDP/CCPA/PIPEDA scope, data residency, opt-out must be respected, human-review gate ✔
> - 10 — Database conventions (*.sql, *.java repositories): per-service DB only, outbox table required, index conventions, no cross-service joins ✔

> **Where should the rules be placed?**
> - .cursor/rules/ at workspace root (D:\pdea\propeller\.cursor\rules\) ✔
> - .cursor/rules/ inside the L-D folder (D:\pdea\propeller\L-D\.cursor\rules\)

All 10 rules selected, placed at `.cursor/rules/` in the workspace root. Creating them now.

All 10 rules created at `D:\pdea\propeller\.cursor\rules\`. Here is a summary:

| Rule file | Apply when | Key guidance |
|---|---|---|
| `01-project-overview.mdc` | Always | What the system is, locked tech decisions, non-negotiable service boundaries |
| `02-multi-tenant-data-access.mdc` | Always | `tenant_id` on every query, no cross-tenant, no cross-service DB reads, Redis key prefix |
| `03-springboot-service-conventions.mdc` | `*.java` | Package layout, outbox-only publish, idempotency check, constructor injection, OTel MDC logging |
| `04-kafka-event-contracts.mdc` | `*.java`, `*.proto` | Event naming, Protobuf FULL compatibility, idempotent consumers, DLQ routing, topic naming |
| `05-risk-rules-dsl.mdc` | `**/rules/**/*.json/yaml` | Required JSON fields, `requireHumanReview: true` for CRITICAL/HIGH, approved metric names, versioning |
| `06-react-frontend-conventions.mdc` | `*.tsx`, `*.ts` | TanStack Query, ApexCharts default, WCAG 2.1 AA (focus, contrast, colour-blind safe badges), WebSocket hook |
| `07-rest-api-design.mdc` | `*Controller.java`, `*Resource.java` | `Idempotency-Key` header, standard error shape, OpenAPI annotations, HTTP status codes, pagination |
| `08-security-pii.mdc` | `*.java` | No secrets in code, Vault-based PII encryption, consent check before profiling, human-review gate, erasure-aware queries |
| `09-compliance-guardrails.mdc` | Always | Opt-out enforcement, erasure saga participation, data residency (EU/India), consent before analytics, DPA required |
| `10-database-conventions.mdc` | `*.sql`, `*Repository.java`, `*Entity.java` | Service-DB ownership table, outbox DDL template, index conventions, Flyway migrations, reporting-db is read-only |

