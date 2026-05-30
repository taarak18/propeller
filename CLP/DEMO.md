# LearnTrack POC — Demo Script

A 5-minute walkthrough proving the `architecture/` design is feasible: a multi-tenant,
event-driven L&D risk/intervention/compliance platform with the React app wired to 6 live
Spring Boot microservices over Kafka.

## Start the stack

```bash
# 1. Backend (Docker) — infra + 6 services
cd CLP/backend/infra
docker compose up -d --build        # wait until all services are healthy

# 2. Seed demo data (tenant_acme_corp)
cd CLP/backend
node infra/seed.mjs

# 3. Frontend
cd CLP/ld-insights
npm install
npm run dev                         # http://localhost:5173
```

Health: `http://localhost:808{1..6}/actuator/health` → UP.

## The narrative

1. **Log in (multi-tenant + RBAC).** Dev-login screen → pick **Acme Corp** + **LD_ADMIN**.
   The app mints a dev JWT; every API call carries it; services scope all data by `tenant_id`.
   Switch the tenant in the top-right to show isolation (Globex has no data until seeded).

2. **Dashboard (CDC-style read model).** Org compliance, risk distribution, at-risk count,
   active interventions, awaiting-review — all served by `reporting-service`, which built its
   read model purely by consuming Kafka events (`profile.updated`, `risk.detected`, …).

3. **The value chain is live.** It was produced automatically when `seed.mjs` POSTed learning
   data to `ingestion-service`:
   `ingest → data.ingested → profile-service (curated profile + metrics) → profile.updated →
   risk-service (rule engine classifies) → risk.detected → intervention-service (auto-recommends)
   + reporting-service (aggregates)`.

4. **At-Risk Monitor.** 6 learners flagged (1 Critical, 3 High, 2 Medium). Critical/High are
   gated `PENDING` human review — **GDPR Art.22 / CCPA automated-profiling gate**. Open a learner
   to see the real profile (attendance, assessments, milestones, metrics).

5. **Human-review gate.** On the At-Risk page, confirm/override/dismiss a Critical assessment.
   `risk.review.completed` flows to reporting; the "awaiting review" KPI drops.

6. **Intervention lifecycle (Temporal-pattern state machine).** Interventions page: a recommended
   intervention → **Approve** (LD_MANAGER/LD_ADMIN only) → becomes Active → log sessions →
   Complete with pre/post outcome. The dashboard "Active Interventions" updates live.

7. **Live ingestion demo.** Re-run a small ingest (e.g. a failing assessment for a healthy
   employee) and watch a new at-risk learner appear after the event propagates.

8. **Compliance: consent opt-out + right to be forgotten in reports.** Settings → enter an
   employee → **withdraw `risk_profiling` consent**. `consent.withdrawn` suppresses their risk
   profiling (they drop off the at-risk list) and **pseudonymises them (`REDACTED-…`)** in any
   generated compliance report (Reporting page → Generate → Download CSV).

## What this proves vs. production
Same patterns, POC-simplified substitutions: outbox + poller (→ Debezium), in-service state
machine + scheduled timer (→ Temporal), dev JWT (→ Kong/JWKS/SSO), one DB w/ schema-per-service
(→ DB-per-service). See `CLP/backend/CONTRACTS.md`.
