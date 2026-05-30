# LearnTrack POC — Backend

Proof-of-concept implementation of the Corporate L&D SaaS architecture in `architecture/`.
6 Spring Boot 3 / Java 21 microservices + Kafka (Redpanda) + PostgreSQL, wired to the React app in `CLP/ld-insights`.

> POC simplifications (see `CONTRACTS.md`): one Postgres instance with **schema-per-service**
> (services only touch their own schema; cross-service data flows via Kafka), **outbox + scheduled
> poller** instead of Debezium, **in-service state machine + scheduled timer** instead of Temporal,
> **dev HS256 JWT** instead of a real IdP, **no API gateway** (Vite dev-proxy routes to services).

## Services

| Service | Port | Schema | Role |
|---|---|---|---|
| ingestion-service | 8081 | ingestion | Idempotent ingest → `data.ingested` |
| profile-service | 8082 | profile | Curated profile + metrics → `profile.updated`; hosts `/api/auth/dev-token` |
| risk-service | 8083 | risk | Rules + classification + human-review gate → `risk.detected` |
| intervention-service | 8084 | intervention | Lifecycle state machine → `intervention.*` |
| consent-service | 8085 | consent | Consent + opt-out → `consent.*` |
| reporting-service | 8086 | reporting | CDC-style read model, dashboard, reports |

Infra: PostgreSQL `5432`, Redpanda/Kafka `9092`, Redis `6379` (reserved).

## Prerequisites
- Docker Desktop (running). No host Java/Maven needed — services build inside Docker.
- Node 18+ (for the seed script and the frontend).

## Run

```bash
cd CLP/backend/infra
docker compose up --build        # first build downloads Maven deps; allow several minutes
```

Wait until all services log "Started ...Application". Then seed demo data:

```bash
cd CLP/backend
node infra/seed.mjs              # creates employees + ingests data for tenant_acme_corp
```

Start the frontend (separate terminal):

```bash
cd CLP/ld-insights
npm install
npm run dev                      # http://localhost:5173
```

Log in via the dev-login screen (pick tenant **Acme Corp** + role **LD_ADMIN**).

## Health
Every service: `GET http://localhost:808X/actuator/health` → `{"status":"UP"}`.

## Architecture mapping
See `CONTRACTS.md` for the full API/event contract. The value chain
`ingest → profile → risk → (human review) → intervention → reporting` plus `consent opt-out`
mirrors the flows in `architecture/03-technical-flows.md`.
