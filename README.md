# LearnTrack CLP — Corporate Learning Progress Platform

**LearnTrack CLP** is a multi-tenant SaaS platform for tracking employee learning progress, identifying at-risk learners, managing interventions, and producing compliance-ready reports. It is an **aggregation, analytics, and workflow layer** on top of existing LMS/HRIS systems — not a full LMS.

This repository contains:

- **Production architecture** (design documents for the full system)
- A **live proof-of-concept (POC)** that validates the core domain model and event pipeline
- **Presentation assets** for stakeholder and project-owner reviews

---

## Repository structure

```
propeller/
├── architecture/              # Production architecture (design only)
├── CLP/                       # Live POC implementation
│   ├── backend/               # 6 Spring Boot microservices + infra
│   └── ld-insights/           # React dashboard (frontend)
├── compliance/                # All compliance-related documents
└── .cursor/rules/             # Workspace coding & compliance guardrails
```

### `architecture/` — Production design

Authoritative architecture for the **production-ready** system (11 microservices, AWS, Temporal, Debezium, Kong, etc.). The POC implements a simplified subset of this design.

| Document | Contents |
|---|---|
| [`00-executive-summary.md`](architecture/00-executive-summary.md) | Vision, business objectives, tech stack, subscription tiers |
| [`01-architecture.md`](architecture/01-architecture.md) | High-level system architecture, service responsibilities, security |
| [`02-database.md`](architecture/02-database.md) | Multi-tenant DB strategy, data ownership, PII classification |
| [`03-technical-flows.md`](architecture/03-technical-flows.md) | Tenant provisioning, ingestion, risk detection, erasure sagas |
| [`04-user-journeys.md`](architecture/04-user-journeys.md) | Role-based user journeys and accessibility requirements |
| [`05-deployment.md`](architecture/05-deployment.md) | AWS deployment, multi-region residency, observability |
| [`Microservice_Communication_Architecture.md`](architecture/Microservice_Communication_Architecture.md) | Sync vs async communication patterns |
| [`SaaS_Event_Contracts.md`](architecture/SaaS_Event_Contracts.md) | Kafka event envelope and topic contracts |
| Other files | Risk rules engine spec, tenant management API, architecture review summary |

**Start here:** [`architecture/00-executive-summary.md`](architecture/00-executive-summary.md)

### `CLP/` — Proof of concept (runnable)

The POC validates the end-to-end value chain: **ingest → profile → risk → intervention → reporting**, plus consent opt-out and human-review gate.

```
CLP/
├── backend/
│   ├── common-lib/            # Shared: JWT filter, tenant context, outbox, event envelope
│   ├── ingestion-service/     # Port 8081 — idempotent ingest → data.ingested
│   ├── profile-service/       # Port 8082 — curated profiles → profile.updated
│   ├── risk-service/          # Port 8083 — rules, classification, human-review gate
│   ├── intervention-service/  # Port 8084 — intervention lifecycle + SLA
│   ├── consent-service/       # Port 8085 — consent grant/withdraw → consent.*
│   ├── reporting-service/     # Port 8086 — Kafka-fed dashboard & CSV reports
│   ├── infra/                 # docker-compose.yml, Dockerfile, DB init, seed script
│   ├── CONTRACTS.md           # POC API/event contract (source of truth for integration)
│   └── README.md              # Backend-specific run instructions
└── ld-insights/               # React 18 + Vite dashboard
    └── src/pages/             # Dashboard, At-Risk, Interventions, Rules, Reporting, Settings, …
```

**POC simplifications** (vs production — see [`CLP/backend/CONTRACTS.md`](CLP/backend/CONTRACTS.md)):

| Production target | POC today |
|---|---|
| 11 services + Kong gateway | 6 services, Vite dev-proxy (no gateway) |
| Debezium CDC | Outbox + scheduled poller |
| Temporal workflows | In-service state machine + `@Scheduled` SLA timer |
| JWKS / SSO auth | Dev HS256 JWT (`/api/auth/dev-token`) |
| DB-per-service | One PostgreSQL, schema-per-service |
| Protobuf + Schema Registry | JSON Kafka payloads |

### `compliance/` — Compliance documents

Contains **all compliance-related documents** for the platform — regulatory requirements, accessibility standards, and privacy obligations that inform architecture and POC design (GDPR, CCPA, DPDP, PIPEDA, WCAG, and related guidance).

| Document | Contents |
|---|---|
| [`Global_Compliance_Regulations_LD_System.md`](compliance/Global_Compliance_Regulations_LD_System.md) | Cross-region regulations and compliance controls |
| [`Accessibility_Compliance_LD_System.md`](compliance/Accessibility_Compliance_LD_System.md) | WCAG 2.1 AA and accessibility requirements |

---

## Quick start — run the POC

### Prerequisites

- **Docker Desktop** (running) — services build inside Docker; no host Java/Maven required
- **Node.js 18+** — for the seed script and frontend

### 1. Start the backend stack

```bash
cd CLP/backend/infra
docker compose up --build -d
```

First build downloads Maven dependencies — allow several minutes. Wait until all six services report started (or check health endpoints below).

### 2. Seed demo data

```bash
cd CLP/backend
node infra/seed.mjs
```

Creates employees and ingests training data for tenant **`tenant_acme_corp`**.

### 3. Start the frontend

```bash
cd CLP/ld-insights
npm install
npm run dev
```

Open **http://localhost:5173** and log in via the dev-login screen:

- **Tenant:** Acme Corp (seeded data) or Globex Ltd (empty — shows multi-tenant isolation)
- **Role:** LD_ADMIN (full admin access)

### Health checks

Each service exposes Spring Boot Actuator:

```
http://localhost:8081/actuator/health   # ingestion
http://localhost:8082/actuator/health   # profile
http://localhost:8083/actuator/health   # risk
http://localhost:8084/actuator/health   # intervention
http://localhost:8085/actuator/health   # consent
http://localhost:8086/actuator/health   # reporting
```

All should return `{"status":"UP"}`.

### What to demo

1. **Dashboard** — live KPIs fed by Kafka events (not mocked)
2. **At-Risk Monitor** — learners classified Critical / High / Medium
3. **Human-review gate** — CRITICAL/HIGH assessments require review before employee notification
4. **Interventions** — approve, log sessions, complete with pre/post scores
5. **Settings** — withdraw `risk_profiling` consent → employee drops off at-risk list; reports pseudonymised
6. **Tenant switcher** (top nav) — switch Acme ↔ Globex to prove isolation

More detail: [`CLP/backend/README.md`](CLP/backend/README.md)

---

## Core value chain

```
LMS/HRIS  →  Ingestion  →  Profile  →  Risk Engine  →  Intervention  →  Reporting
                │              │            │                │
                └────────────── Kafka events (tenant-scoped) ──────────────┘
                                      Consent opt-out suppresses risk profiling
```

Event contracts: [`CLP/backend/CONTRACTS.md`](CLP/backend/CONTRACTS.md) (POC) · [`architecture/SaaS_Event_Contracts.md`](architecture/SaaS_Event_Contracts.md) (production)

---

## Technology stack

| Layer | Production (architecture/) | POC (CLP/) |
|---|---|---|
| Backend | Spring Boot 3 / Java 21 | ✓ Same |
| Frontend | React 18 + TypeScript + Vite + shadcn/ui | React 18 + Vite (JSX) |
| Event bus | Kafka (MSK) + Protobuf | Redpanda + JSON |
| Workflow | Temporal OSS | In-service state machine |
| Database | PostgreSQL per service | PostgreSQL, schema-per-service |
| Gateway | Kong + JWKS | Vite dev proxy |

---

## Frontend routes

| Page | URL |
|---|---|
| Dashboard | `/` |
| At-Risk Monitor | `/at-risk` |
| Employee Profile | `/at-risk/:id` |
| Interventions | `/interventions` |
| Session Planner | `/sessions` |
| Rules | `/rules` |
| Reporting | `/reporting` |
| Settings / Consent | `/settings` |
| Help | `/help` |

---

## Further reading

- POC integration contract: [`CLP/backend/CONTRACTS.md`](CLP/backend/CONTRACTS.md)
- Production executive summary: [`architecture/00-executive-summary.md`](architecture/00-executive-summary.md)
- Compliance documents: [`compliance/`](compliance/)
