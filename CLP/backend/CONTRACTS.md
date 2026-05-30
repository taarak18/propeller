# LearnTrack POC — Shared Contracts (source of truth)

> Every backend service and the frontend MUST conform to this document.
> Derived from `architecture/` (00–05, Microservice_Communication_Architecture, SaaS_Event_Contracts).
> POC deviations are explicitly noted. Do not change this file without coordinating all agents.

## 0. POC ground rules

- **Backend:** Spring Boot 3.3.x / Java 21 only. Built inside Docker (`maven:3.9-eclipse-temurin-21`).
- **No API gateway** (PM decision). Frontend reaches services directly; the Vite dev server proxies path prefixes to service ports.
- **One PostgreSQL instance, schema-per-service** (PM decision + workspace-rule compromise). A service may ONLY access its own schema. Cross-service data flows via Kafka events — never cross-schema reads.
- **Event bus:** Kafka (Redpanda single node). JSON payloads for the POC (Protobuf deferred).
- **Outbox + scheduled poller** replaces Debezium. **In-service state machine + scheduled timer** replaces Temporal.
- **Auth:** dev-signed HS256 JWT validated locally by every service via `common-lib`. No real IdP.
- Group/package root: `com.learntrack`. Maven groupId `com.learntrack`.

## 1. Service registry (ports & schemas)

| Service | Port | DB schema | Kafka consumer group |
|---|---|---|---|
| `ingestion-service`   | 8081 | `ingestion`   | n/a (producer) |
| `profile-service`     | 8082 | `profile`     | `profile-svc` |
| `risk-service`        | 8083 | `risk`        | `risk-svc` |
| `intervention-service`| 8084 | `intervention`| `intervention-svc` |
| `consent-service`     | 8085 | `consent`     | `consent-svc` |
| `reporting-service`   | 8086 | `reporting`   | `reporting-svc` |

Infra: PostgreSQL `5432` (db `learntrack`, user `learntrack`/`learntrack`), Redpanda/Kafka `9092` (internal `redpanda:29092`), Redis `6379` (optional cache).

## 2. Auth / tenant context

- Header: `Authorization: Bearer <jwt>` (HS256, secret = env `JWT_SECRET`, default `learntrack-poc-dev-secret-change-me-please-32b`).
- Claims: `sub` (user id), `tenant_id`, `roles` (array: `TRAINER`, `LD_ADMIN`, `LD_MANAGER`, `EMPLOYEE`), `name`.
- `common-lib` `JwtAuthFilter` validates and populates `TenantContext` (ThreadLocal) + request attributes `X-Tenant-ID`, `X-User-ID`, `X-Roles`.
- **Every repository query MUST be scoped by `tenant_id`** (workspace rule 02).
- Dev token mint endpoint (provided by `common-lib`, hosted by every service, frontend uses profile-service): `POST /api/auth/dev-token` body `{ "userId","tenantId","name","roles":[] }` → `{ "token": "..." }`.

Seed tenants: `tenant_acme_corp` (plan pro), `tenant_globex_ltd` (plan starter).

## 3. Event envelope (Kafka, JSON)

Topic name == `event_type`. Auto-create enabled.

```json
{
  "event_id": "uuid",
  "event_type": "data.ingested",
  "event_version": "v1",
  "tenant_id": "tenant_acme_corp",
  "source_service": "ingestion-service",
  "timestamp": "2026-05-30T10:30:00Z",
  "correlation_id": "uuid",
  "payload": { }
}
```

`common-lib` provides `EventEnvelope`, `OutboxEvent` entity, `OutboxPublisher.enqueue(...)`, and `OutboxPoller` (@Scheduled, every 1s) that publishes unpublished rows and marks `published_at`.

### Event catalog (POC subset)

| event_type | publisher | consumers | payload |
|---|---|---|---|
| `data.ingested` | ingestion | profile | `{ dataType, jobId, employeeIds:[], records:[...] }` |
| `profile.updated` | profile | risk, reporting | `{ employeeId, employeeName, department, jobTitle, riskProfilingOptOut, snapshot:{ attendancePct, avgScore, scoreTrend, milestoneCompletionPct, daysSinceProgress } }` |
| `risk.detected` | risk | intervention, reporting, (notification=log) | `{ riskId, employeeId, employeeName, department, riskLevel, riskScore, trigger, metric, threshold, riskFactors, rulesTriggered:[], requiresHumanReview, recommendedInterventions:[] }` |
| `risk.review.completed` | risk | reporting | `{ riskId, employeeId, decision, finalRiskLevel }` |
| `risk.resolved` | risk | intervention, reporting | `{ riskId, employeeId }` |
| `intervention.assigned` | intervention | reporting | `{ interventionId, employeeId, type, status }` |
| `intervention.session.logged` | intervention | reporting | `{ interventionId, sessionsAttended, totalSessions }` |
| `intervention.completed` | intervention | risk, reporting | `{ interventionId, employeeId, improvementPct }` |
| `consent.updated` | consent | risk, reporting | `{ employeeId, purpose, status }` |
| `consent.withdrawn` | consent | risk, reporting | `{ employeeId, purpose, riskProfilingOptOut }` |

## 4. REST API (through Vite proxy prefixes)

All responses JSON. All list endpoints scoped to caller's tenant. Vite proxies these prefixes to the owning service.

### ingestion-service  (proxy `/api/v1/ingest` → 8081)
- `POST /api/v1/ingest/training-attendance` (hdr `Idempotency-Key`) body `{ records:[{employeeId,sessionDate,sessionType,trainingModule,status,reason}] }` → `202 {jobId}` or `200 {jobId, alreadyProcessed:true}`
- `POST /api/v1/ingest/assessments` body `{ records:[{employeeId,competency,trainingModule,assessmentName,score,maxScore,assessmentDate,rating}] }`
- `POST /api/v1/ingest/competency-milestones` body `{ records:[{employeeId,milestoneName,competency,status,completionDate,proficiencyLevel}] }`
- `GET /api/v1/ingest/jobs` → recent ingestion jobs

### profile-service  (proxy `/api/v1/employees` → 8082; also `/api/auth/dev-token`)
- `GET /api/v1/employees?dept=&q=` → `[{employeeId,firstName,lastName,department,jobTitle,workEmail,riskProfilingOptOut, metrics:{attendancePct,avgScore,scoreTrend,milestoneCompletionPct}}]`
- `GET /api/v1/employees/{id}` → full profile incl. `attendance:[]`, `assessments:[]`, `milestones:[]`, `metrics:{}`
- `POST /api/v1/employees` (seed/admin) create employee
- `GET /api/v1/employees/{id}/metrics`

### risk-service  (proxy `/api/v1/risk` and `/api/v1/rules` → 8083)
- `GET /api/v1/risk/at-risk?riskLevel=&dept=&trigger=` → `[{riskId,employeeId,employeeName,department,riskLevel,riskScore,trigger,metric,threshold,requiresHumanReview,reviewStatus}]`
- `GET /api/v1/risk/{riskId}` → detail incl `rulesTriggered`, `riskFactors`, `reviews:[]`
- `POST /api/v1/risk/{riskId}/review` body `{decision: CONFIRMED|OVERRIDDEN|DISMISSED, newRiskLevel?, notes}` (role TRAINER/LD_MANAGER/LD_ADMIN)
- `GET /api/v1/risk/summary` → `{critical,high,medium,low, pendingReviews}` (used by dashboard/at-risk KPIs)
- Rules: `GET /api/v1/rules`, `POST /api/v1/rules`, `PUT /api/v1/rules/{id}`, `POST /api/v1/rules/{id}/test` body `{profiles:[]}`, `PUT /api/v1/rules/{id}/activate`

Rule definition JSON (see architecture 01 §Rule Management):
```json
{ "operator":"AND","criteria":[{"metric":"training_attendance_percentage","period":"30_days","operator":"less_than","value":80}] }
```
Metrics available on snapshot: `training_attendance_percentage`, `competency_average_score`, `score_trend`(-1..1), `milestone_completion_percentage`, `days_since_progress`.
Classification: score 85+ CRITICAL, 65–84 HIGH, 40–64 MEDIUM, <40 LOW. CRITICAL/HIGH ⇒ `requiresHumanReview=true`; `risk.detected` carries flag; full employee notification withheld until review (POC: only logged).
**Opt-out:** if employee `riskProfilingOptOut==true` → skip assessment, log suppression. (risk-service tracks opt-out from `consent.withdrawn`/`consent.updated` events + a local cache table.)

### intervention-service  (proxy `/api/v1/interventions` → 8084)
- `GET /api/v1/interventions?status=` → list
- `POST /api/v1/interventions` body `{employeeId, riskId?, interventionType, description, startDate, endDate, totalSessions, assignedTrainer}` → creates `RECOMMENDED`/`PENDING_APPROVAL`
- `PUT /api/v1/interventions/{id}/approve` (LD_MANAGER/LD_ADMIN) → `ACTIVE`
- `PUT /api/v1/interventions/{id}/reject`
- `POST /api/v1/interventions/{id}/sessions` body `{sessionDate, attended, notes}` → increments sessionsAttended
- `PUT /api/v1/interventions/{id}/complete` body `{preValue, postValue}` → records outcome + improvementPct
- `GET /api/v1/interventions/summary` → `{active, pendingApproval, completed}`
State machine: RECOMMENDED→PENDING_APPROVAL→ACTIVE→COMPLETED→EVALUATED; ACTIVE→CANCELLED; ESCALATED on SLA timer (scheduled). Auto-creates a `RECOMMENDED` intervention when consuming `risk.detected`.

### consent-service  (proxy `/api/v1/consents` → 8085)
- `GET /api/v1/consents/{employeeId}` → consent records
- `POST /api/v1/consents` body `{employeeId, purpose, action: GRANT|WITHDRAW, jurisdiction}`
- `DELETE /api/v1/consents/{employeeId}/purpose/{purpose}` → withdraw; if purpose==`risk_profiling` set opt-out, publish `consent.withdrawn{riskProfilingOptOut:true}`
- `GET /api/v1/consents/disclosures?jurisdiction=` → static disclosure texts
Purposes: `risk_profiling`, `anonymised_benchmarking`, `ml_scoring`, `trainer_notes`, `third_party_sharing`.

### reporting-service  (proxy `/api/v1/dashboard` and `/api/v1/reports` → 8086)
- `GET /api/v1/dashboard/summary` → KPIs for Dashboard page:
```json
{ "kpis": {"orgCompliance":92,"attendanceTrend":3,"atRiskLearners":42,"activeInterventions":15,"awaitingReview":6},
  "riskDistribution": {"high":42,"medium":128,"low":684},
  "complianceTrend": [{"month":"Apr","value":80}, ...],
  "alerts": [{"entity":"Dept: Sales","time":"2h ago","message":"..."}] }
```
- `GET /api/v1/reports` → list generated reports `[{reportId,name,type,generatedAt,status}]`
- `POST /api/v1/reports/generate` body `{templateType, period}` → creates report metadata (export = stub CSV string)
- `GET /api/v1/reports/{id}/download` → CSV (opted-out employees pseudonymised)
Builds read-model aggregates by consuming `profile.updated`, `risk.detected`, `risk.review.completed`, `intervention.*`, `consent.*`.

## 5. Health & ops
Every service: `GET /actuator/health` returns UP. Spring Boot Actuator included.

## 6. Definition of done (integration)
`docker compose up` (in `CLP/backend/infra`) starts infra + 6 services. `seed.*` script mints a dev token and POSTs employees + ingest batches for `tenant_acme_corp`. Frontend (`CLP/ld-insights`, `npm run dev`) shows live data; ingesting a failing assessment surfaces a new at-risk learner with pending human review; opting out via Settings suppresses profiling + pseudonymises reports.
