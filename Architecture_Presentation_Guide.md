# Multi-Tenant SaaS Platform — Architecture Presentation Guide

> **Comprehensive preparation guide for Corporate Learning Progress, Intervention & Compliance Tracking System**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer-by-Layer Explanation](#layer-by-layer-explanation)
3. [Security Zones](#security-zones)
4. [Multi-Tenancy & Isolation](#multi-tenancy--isolation)
5. [Architecture Principles](#architecture-principles)
6. [Key Event Flow](#key-event-flow)
7. [Acronyms & Full Forms](#acronyms--full-forms)
8. [Design Patterns Deep Dive](#design-patterns-deep-dive)
9. [Pattern-to-Problem Mapping](#pattern-to-problem-mapping)
10. [Q&A Preparation](#qa-preparation)

---

## Architecture Overview

This is a **Corporate Learning Progress, Intervention & Compliance Tracking System** — a multi-tenant SaaS platform that consolidates fragmented employee learning data across organizations. It's NOT a full LMS; it's a lightweight aggregation, analytics, and workflow layer on top of existing learning systems.

### Core Value Proposition
- **Early risk detection:** 4–6 weeks before compliance failure
- **Intervention effectiveness:** 70% show improvement
- **Training completion improvement:** 25% increase in completion rates

### Platform Type
Multi-tenant SaaS with three isolation tiers:
- **Starter:** Shared infrastructure, row-level security
- **Pro:** Schema-per-tenant isolation
- **Enterprise:** Dedicated database and namespace

---

## Layer-by-Layer Explanation

### Layer 1: CLIENT LAYER (Internet / Untrusted Zone)

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **LMS / HRIS APIs** | External system integration endpoints — pulls training data from existing LMS platforms (Cornerstone, SuccessFactors, etc.) and HR systems | This is the primary data source; the platform aggregates data rather than replacing existing LMS |
| **Mobile PWA** | Progressive Web App for mobile access — trainers/managers can review at-risk employees on the go | PWA chosen over native apps for cross-platform reach with single codebase |
| **Web App (React 18)** | Primary dashboard for L&D Admins, Trainers, and Managers | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui design system; WCAG 2.1 AA compliant |

**Key point:** Tenant is identified via subdomain/token at this layer; tenant context propagated in every request downstream.

---

### Layer 2: EDGE LAYER (DMZ / Edge Security Zone)

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **CloudFront CDN** | Content delivery network — caches static assets, reduces latency globally | Sits in front of all traffic; first line of defense |
| **AWS WAF** | Web Application Firewall with OWASP Core Rules + IP reputation blocking | Protects against SQL injection, XSS, DDoS (AWS Shield Standard) |
| **Kong API Gateway** | JWT validation + rate limiting + tenant context injection | Uses JWKS-local validation so Auth Service is NOT on the hot path of every request; resolves tenant context here |

**Key point:** Tenant context is resolved at the API Gateway level. Rate limiting is enforced per-tenant per-endpoint. This prevents one tenant from consuming resources meant for others.

---

### Layer 3: BFF LAYER (Application Access Zone)

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **Mobile BFF** | Backend-For-Frontend optimized for mobile clients | Tailors response payloads for mobile constraints (smaller payloads, fewer round trips) |
| **Web BFF** | Backend-For-Frontend optimized for web dashboard | Aggregates multiple service responses into single view-optimized payloads |

**Key point:** Separate BFFs provide optimal client-specific experiences. They forward tenant context downstream. This layer prevents clients from directly calling domain services.

---

### Layer 4: DOMAIN SERVICES (Private Compute Zone)

All services are **tenant-aware** — business rules and data are isolated by tenant.

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **Ingestion Service** | Receives raw training data from LMS/HRIS; validates, deduplicates (idempotency key), stages raw data | Owns raw staging ONLY — never curated data. Publishes `data.ingested` event to Kafka |
| **Rule Management** | Stores and versions risk detection rules as JSON DSL per tenant | L&D Admins author rules via UI; supports AND/OR/NOT conditions; cached in Redis (5-min TTL) |
| **Risk Engine** | Evaluates rules against employee profile snapshots to detect at-risk learners | Subscribes to `profile.updated`; evaluates per-tenant active rules; adds human-review gate for HIGH/CRITICAL (GDPR Article 22 compliance) |
| **Employee Profile** | Curated read model of employee learning progress | Built exclusively from `data.ingested` Kafka events — NOT from direct DB queries. Owns the "golden record" of learning state |
| **Reporting Service** | Generates compliance reports, dashboards, analytics | CDC-fed read model (Debezium) — denormalized aggregates. No dual-write pattern |
| **Intervention Service** | Manages learning intervention lifecycle | State machine: Recommended → PendingApproval → Active → Completed → Evaluated. Orchestrated by Temporal workflows with 48h SLA escalation |

---

### PLATFORM SERVICES (Control Plane)

These are cross-cutting services that support all domain services:

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **Auth Service (OIDC/SSO)** | Authentication and authorization; OIDC provider, SAML integration for Enterprise | NOT on hot path — JWT validated locally at gateway via JWKS |
| **Tenant Management** | Central control plane for onboarding, provisioning, billing, feature flags | Auto-provisions tenant environment via Temporal saga in < 5 minutes. Resolves tenant DB schema, limits, flags |
| **Temporal Workflow Engine** | Long-running workflow orchestration with tenant isolation | Orchestrates: tenant provisioning (8-step saga), interventions, right-to-erasure, plan upgrades |
| **Notification Service** | Multi-channel notifications (email, in-app, push) | Triggered by risk detection, intervention SLA breaches, compliance deadlines |
| **Audit Service (Immutable Logs)** | Hash-chained immutable audit trail | `chain_hash = SHA-256(event + prev_hash)` for tamper detection; stored with S3 Object Lock (WORM compliance) |
| **Consent Service** | GDPR/DPDP/CCPA/PIPEDA consent lifecycle management | Consent capture on first login; withdrawal immediately suppresses future risk assessments |

---

### Layer 5: DATA LAYER (Restricted Zone)

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **PostgreSQL (Per Service)** | Database-per-service ownership — 10 separate databases | **Starter tier:** Row-Level Security (RLS) with `tenant_id` filter. **Pro tier:** Schema-per-tenant. **Enterprise tier:** Dedicated RDS instance with separate KMS key |
| **Redis Cache** | Tenant-scoped caching layer | Key patterns: `tenant_ctx:{tenant_id}` (60s TTL), `profile:{tenant_id}:{employee_id}`, `rules:{tenant_id}:active` (5-min TTL) |
| **S3 Object Storage** | Immutable document storage with tenant prefix isolation + Object Lock | Audit logs, compliance reports, deletion certificates stored as WORM (Write Once Read Many) |

**Key point:** Data isolation is enforced at every level — RLS/schema/dedicated DB, Redis keys scoped by tenant, S3 prefix per tenant.

---

### Layer 6: EVENT STREAMING LAYER (Async Processing Zone)

| Component | Purpose | Talking Points |
|-----------|---------|----------------|
| **Outbox + Debezium CDC** | Transactional outbox pattern with Change Data Capture | Domain service writes to entity table + outbox table in same DB transaction. Debezium polls outbox and publishes to Kafka — guarantees exactly-once delivery |
| **Kafka / MSK** | Event bus — partitioned/keyed by tenant | Topic naming: `{tenant_id}.{domain}.{event_type}`. Enterprise tenants get dedicated topics; shared tenants use partitioned topics |

**Key point:** Events ensure isolation in asynchronous flows. All events carry `tenant_id`; consumers MUST validate tenant before processing. DLQ strategy: 3 retries with exponential backoff (1s → 4s → 16s).

---

## Security Zones

| Zone | Layer | Protection |
|------|-------|-----------|
| **Internet / Untrusted** | Client Layer | No trust; all traffic treated as hostile |
| **DMZ / Edge Security** | Edge Layer | WAF + CDN filter malicious traffic |
| **Application Access** | BFF Layer | Authenticated traffic only |
| **Private Compute** | Domain Services | mTLS via Istio service mesh; no direct internet access |
| **Restricted Data** | Data Layer | Encrypted at rest (KMS), per-tenant keys via Vault |
| **Async Processing** | Event Streaming | Partitioned by tenant; DLQ for failed events |

---

## Multi-Tenancy & Isolation

| Tier | Database | Compute | Kafka | Use Case |
|------|----------|---------|-------|----------|
| **Starter** | Row-Level Security (shared DB) | Shared namespace | Shared topics (partitioned) | Small organizations |
| **Pro** | Schema-per-tenant (shared RDS) | Shared namespace | Shared topics (partitioned) | Mid-size organizations |
| **Enterprise** | Dedicated DB + KMS key | Dedicated namespace `tenant-{id}` | Dedicated topics | Large regulated organizations |

---

## Architecture Principles

| Principle | Meaning |
|-----------|---------|
| **Security First** | Defense in depth across all zones |
| **Multi-Tenant by Design** | Isolation at every layer — not bolted on |
| **Zero Trust** | Validate every request; mTLS between all services |
| **Scalable & Elastic** | HPA per service; Karpenter auto-provisioning; built for growth |
| **High Availability** | Multi-AZ; RTO < 4h (Starter/Pro), < 1h (Enterprise); RPO < 1h |
| **Compliance Ready** | Audit, Consent, Data Protection (GDPR, DPDP, CCPA, PIPEDA, SOC 2 Type II) |

---

## Key Event Flow

The primary data flow through the system:

```
LMS → Ingestion → [data.ingested] → Profile → [profile.updated] → Risk Engine → [risk.detected] → 
    ├── Intervention Service
    ├── Notification Service  
    ├── Reporting Service
    └── Audit Service
```

---

## Acronyms & Full Forms

### Infrastructure & Networking

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **DMZ** | Demilitarized Zone | A network segment that sits between the public internet and the private internal network. It acts as a buffer zone — services here are exposed to the internet but isolated from internal systems. If an attacker compromises a DMZ component, they still can't reach internal services directly. |
| **CDN** | Content Delivery Network | A globally distributed network of servers that caches and serves static content (images, CSS, JS) from locations geographically close to users, reducing latency. CloudFront is AWS's CDN. |
| **WAF** | Web Application Firewall | A firewall that inspects HTTP traffic and blocks common web attacks (SQL injection, XSS, bot traffic). It operates at Layer 7 (application layer) unlike traditional firewalls that operate at Layer 3/4. |
| **DDoS** | Distributed Denial of Service | An attack where thousands of machines flood a service with traffic to make it unavailable. AWS Shield protects against this. |
| **mTLS** | Mutual Transport Layer Security | Both client AND server present certificates to authenticate each other (normal TLS only authenticates the server). Used for service-to-service communication inside the mesh. |
| **DNS** | Domain Name System | Translates human-readable domain names (e.g., `acme.learning-platform.com`) to IP addresses. Used here for tenant custom domain validation. |
| **VPC** | Virtual Private Cloud | An isolated virtual network in AWS where you deploy resources. Domain services live in private subnets with no direct internet access. |
| **AZ** | Availability Zone | Physically separate data centers within an AWS region. Multi-AZ deployment means your service runs in 2–3 independent data centers for fault tolerance. |

### Authentication & Security

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **JWT** | JSON Web Token | A compact, self-contained token that carries user identity and claims (roles, tenant_id). Digitally signed so it can be verified without calling the Auth Service every time. |
| **JWKS** | JSON Web Key Set | A set of public keys published by the Auth Service. The API Gateway downloads these keys once and validates JWTs locally — this is why Auth Service is NOT on the hot path. |
| **OIDC** | OpenID Connect | An authentication protocol built on top of OAuth 2.0. Provides identity verification ("who is this user?") in addition to authorization ("what can they access?"). |
| **SSO** | Single Sign-On | Users authenticate once and gain access to multiple systems without re-entering credentials. Enterprise tenants use this. |
| **SAML** | Security Assertion Markup Language | An XML-based protocol for exchanging authentication data between an identity provider (e.g., Okta, Azure AD) and a service provider. Used for Enterprise SSO. |
| **KMS** | Key Management Service | AWS service that creates and manages encryption keys. Enterprise tenants get their own KMS key — so even AWS operators can't read their data without the key. |
| **WORM** | Write Once Read Many | Storage that cannot be modified or deleted after writing. Used for audit logs and compliance records — ensures no one can tamper with historical data. |
| **PII** | Personally Identifiable Information | Any data that can identify a person (name, email, employee ID). Classified into tiers: `PII_STANDARD`, `PII_SENSITIVE`, `PII_IDENTIFIER` — each gets different encryption treatment. |

### Architecture Patterns & Styles

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **BFF** | Backend For Frontend | A dedicated backend service tailored for a specific frontend (web vs. mobile). Instead of all clients calling the same generic API, each gets a BFF that aggregates, transforms, and optimizes responses for its client's specific needs. Mobile BFF returns smaller payloads; Web BFF returns richer dashboard data. |
| **CDC** | Change Data Capture | A technique that monitors database transaction logs and captures every insert/update/delete as an event. Debezium reads PostgreSQL's WAL (write-ahead log) and publishes changes to Kafka — the application code doesn't need to explicitly publish events. |
| **DLQ** | Dead Letter Queue | A holding area for messages that fail processing after multiple retries. Instead of losing failed events or blocking the queue, they're moved to a DLQ for later investigation and manual replay. |
| **RLS** | Row-Level Security | A PostgreSQL feature where the database itself enforces access rules on individual rows. A query from Tenant A physically cannot see Tenant B's rows — even if application code has a bug, the DB won't return wrong data. |
| **HPA** | Horizontal Pod Autoscaler | Kubernetes component that automatically scales the number of pod replicas based on CPU/memory usage or custom metrics. E.g., Ingestion Service scales from 2 to 10 pods during bulk data imports. |
| **RTO** | Recovery Time Objective | Maximum acceptable time to restore service after a disaster. Enterprise < 1 hour; Starter/Pro < 4 hours. |
| **RPO** | Recovery Point Objective | Maximum acceptable data loss measured in time. RPO < 1 hour means you lose at most 1 hour of data in a disaster. |
| **WAL** | Write-Ahead Log | PostgreSQL's internal transaction log. Every change is written here before the actual table — enables crash recovery and is what Debezium reads for CDC. |

### Data & Messaging

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **MSK** | Managed Streaming for Apache Kafka | AWS's fully managed Kafka service. Handles cluster management, patching, and scaling. |
| **RDS** | Relational Database Service | AWS managed PostgreSQL/MySQL service. Handles backups, patching, Multi-AZ replication. |
| **S3** | Simple Storage Service | AWS object storage — infinitely scalable, 99.999999999% durable. Used here for audit logs, reports, and deletion certificates with Object Lock. |
| **Protobuf** | Protocol Buffers | Google's binary serialization format for event schemas. Smaller and faster than JSON; enforces schema contracts between producer and consumer via Schema Registry. |
| **TTL** | Time To Live | How long a cached value remains valid before it's automatically evicted. Tenant context cache: 60s TTL; Rules cache: 5-min TTL. |

### DevOps & Observability

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **EKS** | Elastic Kubernetes Service | AWS managed Kubernetes. Runs all 11 microservices + platform services as containerized workloads. |
| **CI/CD** | Continuous Integration / Continuous Delivery | Automated pipeline: code commit → build → test → deploy. GitHub Actions for CI; ArgoCD for CD (GitOps). |
| **GitOps** | Git Operations | Infrastructure and deployments are defined as code in Git. ArgoCD watches the Git repo and automatically applies changes to the cluster. Git is the single source of truth. |
| **SLA** | Service Level Agreement | Contractual performance guarantee. E.g., intervention must be acted upon within 48 hours or it escalates. |
| **P95** | 95th Percentile | 95% of requests complete within this time. Target: API P95 < 200ms means only 5% of requests take longer than 200ms. |
| **FinOps** | Financial Operations | Practice of managing cloud costs. Kubecost tracks per-tenant resource consumption so costs can be attributed and billed correctly. |

### Compliance & Regulations

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **GDPR** | General Data Protection Regulation | EU privacy law. Key requirements: consent, right to erasure, data portability, human review of automated decisions (Article 22). |
| **DPDP** | Digital Personal Data Protection (Act) | India's data privacy law. Requires data residency (India data stays in `ap-south-1`). |
| **CCPA** | California Consumer Privacy Act | US (California) privacy law. Right to know, delete, and opt-out of data selling. |
| **PIPEDA** | Personal Information Protection and Electronic Documents Act | Canada's privacy law. Requires meaningful consent and data stored in `ca-central-1`. |
| **SOC 2** | Service Organization Control Type 2 | Security audit framework. Verifies your controls actually work over time (Type 2 = tested over 6+ months, not just designed on paper). |
| **WCAG** | Web Content Accessibility Guidelines | Accessibility standard. Level AA means: keyboard navigable, screen-reader compatible, sufficient contrast, no information conveyed by color alone. |
| **FERPA** | Family Educational Rights and Privacy Act | US education privacy law (relevant if learners include students). |

### Application-Specific

| Acronym | Full Form | Explanation |
|---------|-----------|-------------|
| **LMS** | Learning Management System | Software for delivering, tracking, and managing training (e.g., Cornerstone, Moodle, SuccessFactors Learning). This platform sits ON TOP of LMS, not replacing it. |
| **HRIS** | Human Resource Information System | Software managing employee data (SAP SuccessFactors, Workday). Source of employee master data. |
| **PWA** | Progressive Web App | A web app that behaves like a native mobile app — works offline, installable, push notifications — without app store distribution. |
| **DSL** | Domain-Specific Language | A mini-language designed for a specific problem. Here, a JSON DSL for writing risk detection rules (instead of code). |
| **BRMS** | Business Rules Management System | Heavy-weight rule engines like Drools or IBM ODM. Rejected for MVP in favor of simpler JSON DSL evaluated by application code. |

---

## Design Patterns Deep Dive

### 1. Transactional Outbox Pattern

**Problem:** You need to update your database AND publish an event to Kafka. If you do both separately, one might succeed and the other fail (data inconsistency).

**Solution:** Write both the entity change and the event message to the SAME database in a single transaction. A separate process (Debezium CDC) reads the outbox table and publishes to Kafka.

```
┌─────────────────────────────────┐
│  Single DB Transaction          │
│  1. UPDATE employee_profile     │
│  2. INSERT INTO outbox_table    │
└─────────────────────────────────┘
         │
    Debezium reads outbox
         │
         ▼
┌─────────────────────────────────┐
│  Kafka: profile.updated event   │
└─────────────────────────────────┘
```

**Why it matters:** Guarantees exactly-once event delivery without distributed transactions.

**Where used in this architecture:**
- All domain services use outbox tables
- Profile Service: Entity update + outbox insert in single transaction
- Debezium CDC polls outbox and publishes to Kafka

---

### 2. Saga Pattern (Orchestrated)

**Problem:** A business operation spans multiple services (e.g., tenant provisioning needs DB creation + namespace setup + Kafka topics + feature flags). Traditional DB transactions can't span services.

**Solution:** Use a Temporal workflow as an orchestrator that executes steps in sequence. If step N fails, it runs compensating actions for steps N-1, N-2, ... back to step 1.

```
Provisioning Saga (8 steps):
1. Create tenant record          ← Compensate: delete record
2. Create database/schema        ← Compensate: drop schema
3. Create Kafka topics           ← Compensate: delete topics
4. Configure feature flags       ← Compensate: remove flags
5. Set up KMS key                ← Compensate: schedule key deletion
6. Create K8s namespace          ← Compensate: delete namespace
7. Configure DNS/routing         ← Compensate: remove route
8. Send welcome notification     ← (no compensation needed)
```

**Why it matters:** Maintains data consistency across microservices without distributed locks.

**Where used in this architecture:**
- Tenant provisioning (8-step saga)
- Plan upgrades (Starter → Pro → Enterprise)
- Right-to-erasure (6 services in sequence)
- Intervention lifecycle with timeouts

---

### 3. CQRS (Command Query Responsibility Segregation)

**Problem:** The shape of data you write (normalized, per-service) is different from the shape you read (denormalized dashboards, cross-service aggregates).

**Solution:** Separate write models (domain services owning their data) from read models (Reporting Service with denormalized aggregates built via CDC/events).

**Where used in this architecture:**
- **Write side:** Domain services write normalized data to their own databases
- **Read side:** Reporting Service builds denormalized views by consuming Kafka events
- CDC feeds from multiple services → optimized read model for dashboards

---

### 4. Event-Driven Architecture

**Problem:** Tight coupling between services — if Risk Engine calls Intervention directly, both must be available and changes in one break the other.

**Solution:** Services communicate by publishing and subscribing to events. The Risk Engine publishes `risk.detected`; it doesn't know or care who consumes it.

```
Risk Engine → publishes risk.detected → Kafka
    ├── Intervention Service (creates intervention)
    ├── Notification Service (alerts trainer)
    ├── Reporting Service (updates dashboards)
    └── Audit Service (records for compliance)
```

**Why it matters:** Services are loosely coupled, independently deployable, and new consumers can be added without modifying producers.

**Where used in this architecture:**
- 13 event types flowing through Kafka
- Standard envelope: `event_id`, `event_type`, `event_version`, `tenant_id`, `correlation_id`
- Fan-out pattern: one producer, multiple consumers

---

### 5. Database-per-Service

**Problem:** If multiple services share a database, they become coupled at the data layer — schema changes in one service break others.

**Solution:** Each microservice owns its database exclusively. No service directly queries another service's database. Cross-service data access happens only via APIs or events.

**Where used in this architecture:**
- 10 separate databases: auth-db, tenant-db, ingestion-db, profile-db, risk-db, rules-db, intervention-db, reporting-db, consent-db, audit-db
- Ingestion owns raw staging data; Profile owns curated data
- Services communicate via Kafka events, not direct DB queries

---

### 6. Service Mesh (Istio + Sidecar Pattern)

**Problem:** Every service needs retry logic, circuit breakers, mTLS, observability — implementing this in each service is repetitive and error-prone.

**Solution:** Deploy a sidecar proxy (Envoy) alongside every service pod. The mesh handles networking concerns transparently — your application code just makes plain HTTP calls.

**What Istio provides here:**
- **mTLS STRICT:** All service-to-service traffic encrypted + mutually authenticated
- **Circuit breaker:** After 5 consecutive errors, stop calling the failing service for 30s
- **Retries:** Automatic 3 retries with exponential backoff
- **Timeout:** 10s default per request
- **Observability:** Automatic distributed tracing without code changes

**Where used in this architecture:**
- All synchronous service-to-service calls go through Envoy sidecar
- mTLS eliminates per-application auth logic
- Circuit breaker prevents cascade failures

---

### 7. API Gateway Pattern

**Problem:** Clients shouldn't know about individual microservices, their locations, or internal routing. Cross-cutting concerns (auth, rate limiting, logging) shouldn't be duplicated in every service.

**Solution:** A single entry point (Kong) handles:
- JWT validation (using locally cached JWKS keys)
- Tenant context resolution and injection
- Rate limiting per tenant per endpoint
- Request routing to appropriate BFF or service
- Feature flag checking (via Unleash SDK)

**Where used in this architecture:**
- Kong sits at the edge after WAF
- Validates JWT without calling Auth Service (JWKS-local)
- Injects tenant context into request headers
- Enforces rate limits: e.g., 100 req/min for Starter, 1000 req/min for Enterprise

---

### 8. Backend-for-Frontend (BFF) Pattern

**Problem:** Different clients have different needs. A mobile app needs small payloads and fewer round trips. A web dashboard needs rich aggregated data. A single API can't optimally serve both.

**Solution:** Create dedicated backend services per client type. Each BFF:
- Calls multiple domain services
- Aggregates responses
- Transforms data into the shape the specific client needs
- Handles client-specific caching strategies

**Where used in this architecture:**
- **Mobile BFF:** Optimized for mobile constraints (smaller payloads, offline support)
- **Web BFF:** Aggregates dashboard views (employee list + risk scores + interventions in single response)
- Both forward tenant context to domain services

---

### 9. Envelope Encryption

**Problem:** Encrypting all PII with a single key is risky — if that key is compromised, ALL data is exposed.

**Solution:** Two-layer encryption:
- **Data Encryption Key (DEK):** Encrypts actual data. Unique per tenant (or per record for sensitive fields).
- **Key Encryption Key (KEK):** Stored in Vault/KMS, encrypts the DEKs. Never leaves the HSM.

**Result:** Even if someone steals the database, they get encrypted data + encrypted DEKs — useless without access to Vault/KMS.

**Where used in this architecture:**
- Per-tenant KMS keys via HashiCorp Vault
- PII columns encrypted with tenant-specific DEKs
- Enterprise tenants get dedicated KMS key per database

---

### 10. Circuit Breaker Pattern

**Problem:** If a downstream service is failing, continuing to send requests wastes resources and can cascade failures.

**Solution:** Three states:
- **Closed** (normal): requests flow through
- **Open** (tripped): after 5 failures, all requests immediately fail without calling downstream (gives the failing service time to recover)
- **Half-Open** (testing): after 30s, allows one request through to test if downstream recovered

**Implemented by:** Istio service mesh (transparent to application code).

**Where used in this architecture:**
- All synchronous service calls protected by circuit breaker
- 5 consecutive errors → circuit opens for 30s
- Prevents cascade failures (e.g., if Profile Service is down, Risk Engine doesn't keep retrying)

---

### 11. Idempotent Consumer Pattern

**Problem:** In distributed systems, messages can be delivered more than once (network retries, CDC replays). Processing the same event twice could create duplicate records.

**Solution:** Every event carries a unique `event_id`. Consumers track processed IDs and skip duplicates. The Ingestion Service uses an `idempotency_key` header for the same purpose.

**Where used in this architecture:**
- All Kafka consumers check `event_id` before processing
- Ingestion Service requires `Idempotency-Key` header on API requests
- Database index on `ingestion_jobs.idempotency_key` ensures uniqueness

---

### 12. Hash-Chained Audit Log (Blockchain-lite)

**Problem:** Audit logs can be tampered with — an attacker could delete evidence of unauthorized access.

**Solution:** Each audit entry includes `chain_hash = SHA-256(current_event + previous_hash)`. If any record is modified or deleted, the chain breaks and tampering is detectable. Combined with S3 Object Lock (WORM), records physically cannot be deleted.

**Where used in this architecture:**
- Audit Service maintains hash-chained log
- Each record contains: `event`, `timestamp`, `tenant_id`, `prev_hash`, `chain_hash`
- Stored in S3 with Object Lock (WORM mode) for regulatory compliance
- Tampering detection: recompute chain from beginning; any mismatch = tampering

---

## Pattern-to-Problem Mapping

| Challenge | Pattern Used |
|-----------|-------------|
| Data consistency across services | Transactional Outbox + Saga |
| Loose coupling between services | Event-Driven Architecture |
| Optimized reads vs. writes | CQRS |
| Network resilience | Circuit Breaker + Retry (Istio) |
| Security between services | Service Mesh (mTLS) |
| Single entry point + cross-cutting | API Gateway |
| Client-specific APIs | BFF |
| Duplicate event handling | Idempotent Consumer |
| Tamper-proof audit | Hash-Chained Log + WORM |
| Multi-service transactions | Orchestrated Saga (Temporal) |
| Data encryption at scale | Envelope Encryption |
| Per-tenant data isolation | RLS / Schema / Dedicated DB |

---

## Q&A Preparation

### Likely Questions and Suggested Answers

**1. "Why not a full LMS?"**

*Answer:* This is a lightweight layer that aggregates and adds intelligence on top of existing LMS investments. Organizations keep their existing LMS platforms (Cornerstone, SuccessFactors, Moodle) but gain centralized visibility, risk detection, and intervention workflows across all learning systems. We don't replace; we augment.

---

**2. "How do you handle GDPR Article 22 (automated decision-making)?"**

*Answer:* We've implemented a human-review gate for automated risk profiling. When the Risk Engine detects a HIGH or CRITICAL risk employee, it flags them for review rather than automatically notifying them. A Trainer must confirm, override, or dismiss the automated classification before the employee is notified. This ensures meaningful human involvement in decisions that significantly affect individuals.

---

**3. "Why Kafka over RabbitMQ?"**

*Answer:* Five key reasons:
- **Durable retention:** Events are retained for replay/audit, not just until consumed
- **Event replay:** Can rebuild read models by replaying historical events
- **Multi-tenant isolation:** Topic partitioning and keying by `tenant_id`
- **High throughput:** Handles thousands of events per second for large tenants
- **Fan-out:** One producer, multiple independent consumers without message duplication

---

**4. "How is tenant isolation guaranteed?"**

*Answer:* Three-tier isolation model:
- **Starter:** PostgreSQL Row-Level Security (RLS) — database enforces tenant filtering
- **Pro:** Schema-per-tenant in shared RDS — logical isolation
- **Enterprise:** Dedicated database + namespace + KMS key — physical isolation

Additional layers:
- Redis keys scoped by `tenant_id`
- Kafka topics partitioned/keyed by tenant
- API Gateway validates tenant context on every request
- Enterprise gets dedicated Kubernetes namespace with resource quotas

---

**5. "What about data residency?"**

*Answer:* Four regional deployments:
- `us-east-1` (primary) — US customers
- `eu-west-1` — GDPR-regulated EU customers
- `ap-south-1` — DPDP-regulated India customers
- `ca-central-1` — PIPEDA-regulated Canadian customers

Tenant data is pinned to their region. EU data never leaves EU; India data never leaves India. Kafka is NOT cross-region replicated for compliance.

---

**6. "How do you ensure exactly-once delivery?"**

*Answer:* Transactional outbox pattern:
1. Domain service writes entity update + event to outbox in single DB transaction
2. Debezium CDC reads outbox table and publishes to Kafka (exactly-once semantics)
3. Consumers use idempotent processing — track `event_id` to skip duplicates

This avoids dual-write anti-pattern and guarantees no event is lost or duplicated.

---

**7. "What's the right-to-erasure process?"**

*Answer:* Temporal saga touching 6 services:
1. Consent Service receives erasure request
2. Profile Service anonymizes employee data
3. Risk Service deletes risk history
4. Intervention Service archives interventions
5. Reporting Service purges from aggregates
6. Audit Service records erasure event (kept permanently for legal compliance)

Employee receives signed deletion certificate as proof. The saga includes compensation — if step 4 fails, steps 1-3 are rolled back.

---

**8. "How do you handle multi-tenant performance?"**

*Answer:* 
- **Horizontal scaling:** HPA per service (Ingestion: 2–10 pods, Profile: 3–10)
- **Resource isolation:** Enterprise tenants get dedicated namespace with quotas
- **Rate limiting:** Per-tenant per-endpoint limits enforced at API Gateway
- **Caching:** Tenant context (60s TTL) and rules (5-min TTL) in Redis
- **Auto-scaling:** Karpenter provisions nodes based on pod demands
- **Cost allocation:** Kubecost tracks per-tenant resource consumption

---

**9. "What's your disaster recovery strategy?"**

*Answer:*
- **RTO:** < 4 hours (Starter/Pro), < 1 hour (Enterprise)
- **RPO:** < 1 hour (continuous WAL archiving every 5 minutes)
- **DR Region:** Warm standby in `us-west-2` with cross-region RDS read replica
- **Failover:** Manual DNS cutover for Starter/Pro; automated for Enterprise
- **Backup:** pgBackRest continuous WAL + Velero nightly K8s snapshots
- **Testing:** Quarterly DR drills with documented runbooks

---

**10. "How do you version APIs and event schemas?"**

*Answer:*
- **API Versioning:** URL-based (`/v1/`, `/v2/`); maintain N-1 version for 90 days
- **Event Versioning:** `event_version` in envelope (e.g., `v1`, `v2`)
- **Schema Registry:** Confluent Schema Registry with Protobuf FULL compatibility mode
- **Migration:** Backward-compatible changes (add optional fields) preferred; breaking changes require new version with overlap period
- **Consumer compatibility:** Consumers must handle both old and new versions during transition

---

**11. "What about observability?"**

*Answer:* Unified observability stack:
- **Metrics:** Prometheus scraping + Grafana dashboards
- **Logs:** OpenTelemetry collector → Loki → Grafana
- **Traces:** OpenTelemetry agent auto-instruments Java services → Tempo
- **Single pane:** Grafana correlates metrics/logs/traces via `trace_id`
- **Alerting:** AlertManager for SLA breaches, error spikes
- **Per-tenant:** Metrics tagged with `tenant_id` for cost allocation and SLA tracking

---

**12. "How do you handle rule authoring?"**

*Answer:* Custom JSON DSL approach:
- **Storage:** Rules stored as versioned JSON in Rule Management Service database
- **Evaluation:** Application code evaluates rules against employee profile snapshot
- **Authoring:** L&D Admin UI provides form-based rule builder (no code required)
- **Versioning:** Every rule change creates new version; audit trail maintained
- **Testing:** Sandbox mode lets admins test rules against sample data before activation
- **Caching:** Active rules cached in Redis (5-min TTL) for fast lookup

Example rule:
```json
{
  "rule_id": "ATTENDANCE_RISK",
  "conditions": {
    "operator": "AND",
    "conditions": [
      {"field": "attendance_rate", "operator": "less_than", "value": 0.7},
      {"field": "consecutive_absences", "operator": "greater_than", "value": 3}
    ]
  },
  "actions": [
    {"type": "alert", "severity": "HIGH", "recipients": ["trainer", "ld_admin"]},
    {"type": "recommend_intervention", "intervention_type": "attendance_coaching"}
  ]
}
```

---

**13. "What's the performance baseline?"**

*Answer:* Target SLAs:
- API response P95 < 200ms
- Dashboard load < 2s
- Risk engine batch (1000 employees) < 2 minutes
- System availability > 99.5% (Enterprise > 99.9%)
- At-risk identification rate > 95%
- Intervention effectiveness > 70% show improvement

Measured via:
- Prometheus metrics
- Synthetic monitoring (Pingdom)
- Real User Monitoring (RUM)
- Load testing (K6) in staging with 10x production load

---

**14. "How do you onboard new tenants?"**

*Answer:* Automated Temporal saga (< 5 minutes):
1. Tenant registers via self-service portal
2. Temporal workflow kicks off 8-step provisioning saga
3. Creates tenant record, database/schema, Kafka topics, KMS key, namespace, routing
4. Sends welcome email with onboarding checklist
5. L&D Admin logs in, configures SSO (if Enterprise), uploads employee roster
6. System begins ingesting data from connected LMS APIs
7. Initial risk assessment runs after first data load
8. Dashboard becomes available with live risk alerts

Progress tracked via status page; estimated completion time shown to customer.

---

## Additional Study Resources

### Key Technologies to Review

1. **Apache Kafka** — Event streaming platform
2. **PostgreSQL Row-Level Security** — Multi-tenant database isolation
3. **Temporal** — Workflow orchestration engine
4. **Istio Service Mesh** — mTLS and resilience
5. **Debezium** — Change Data Capture
6. **HashiCorp Vault** — Secrets management
7. **Kong API Gateway** — API management
8. **OpenTelemetry** — Unified observability

### Recommended Reading

- *Designing Data-Intensive Applications* by Martin Kleppmann (Chapter 11: Stream Processing)
- *Building Microservices* by Sam Newman (Chapter 4: Communication Styles)
- *Monolith to Microservices* by Sam Newman (Chapter 6: Sagas)
- Multi-Tenancy SaaS Best Practices (AWS Well-Architected SaaS Lens)
- GDPR Article 22 — Automated individual decision-making

---

## Presentation Flow Suggestion

1. **Start with the problem** (2 min): Fragmented learning data, late detection of at-risk employees
2. **High-level architecture overview** (3 min): Show the layered diagram, explain the zones
3. **Walk through a user journey** (5 min): New employee → data ingestion → risk detection → intervention → outcome
4. **Deep dive: Multi-tenancy** (4 min): Three-tier model, isolation guarantees
5. **Deep dive: Event-driven flows** (4 min): Show Kafka event flow with outbox pattern
6. **Security & Compliance** (3 min): Encryption, audit trail, GDPR compliance
7. **Scale & Resilience** (3 min): HPA, circuit breakers, DR strategy
8. **Q&A** (remainder)

---

**End of Presentation Guide**
