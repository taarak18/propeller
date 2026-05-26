# 12 · Implementation Roadmap — Greenfield Build

> Phased plan to **build the platform from zero to production** using the cloud-native blueprint. Optimized for an early-stage team that wants to ship the MVP fast while keeping the architecture portable.

---

## 1. Guiding Principles

```mermaid
mindmap
  root((Greenfield<br/>Principles))
    Walking Skeleton First
      One use case end-to-end
      Real auth, real DB, real CI
      Validates architecture early
    Vertical Slices
      Ship one full use case at a time
      Not horizontal layers
      Demos to stakeholders monthly
    Defer Optional Complexity
      Single region until needed
      Single cloud until needed
      Service mesh only when value clear
    Avoid Lock-in From Day One
      Use OSS even when slower to adopt
      Helm/Kustomize, not vendor templates
      Standard protocols (OIDC, S3, Kafka)
```

---

## 2. End-to-End Timeline (12 Months to GA)

```mermaid
gantt
    title Greenfield Build — Zero to GA
    dateFormat YYYY-MM-DD
    axisFormat %b-%y

    section Phase 0 — Decisions
    Cloud + region selection           :p0a, 2026-06-01, 14d
    Team formation                     :p0b, 2026-06-01, 21d
    Repo scaffolding                   :p0c, after p0b, 7d

    section Phase 1 — Foundation
    Provision K8s cluster              :p1a, after p0c, 14d
    Bootstrap GitOps (ArgoCD)          :p1b, after p1a, 7d
    Stateful operators (PG, Redis...)  :p1c, after p1b, 14d
    Observability stack                :p1d, after p1b, 14d
    Identity (Keycloak)                :p1e, after p1c, 14d

    section Phase 2 — Walking Skeleton (MVP-0)
    tenant-svc + auth flow             :p2a, after p1e, 21d
    Hello-world UI                     :p2b, after p1e, 14d
    First demo                         :p2c, after p2a, 1d

    section Phase 3 — Core MVP (UC-01,02,03,05,06,12)
    Onboarding + subscription          :p3a, after p2c, 21d
    Data ingestion (UC-05)             :p3b, after p3a, 30d
    Profile + dashboard                :p3c, after p3b, 30d
    Beta with 3-5 pilot tenants        :p3d, after p3c, 14d

    section Phase 4 — Risk & Intervention (UC-04,07,08,09,10)
    SSO federation                     :p4a, after p3d, 21d
    Risk rules + nightly batch         :p4b, after p4a, 30d
    Intervention workflow              :p4c, after p4b, 30d
    Effectiveness tracking             :p4d, after p4c, 21d

    section Phase 5 — Compliance & Polish (UC-11)
    Report generation                  :p5a, after p4d, 21d
    Multi-tier rate limiting           :p5b, after p4d, 14d
    SOC 2 readiness                    :p5c, after p5a, 30d
    Performance + chaos testing        :p5d, after p5a, 21d

    section Phase 6 — GA
    Production hardening               :p6a, after p5c, 14d
    DR drill                           :p6b, after p6a, 7d
    GA launch                          :p6c, after p6b, 1d
```

---

## 3. Phase 0 — Decisions & Team (Weeks 1-3)

### 3.1 Critical Decisions to Make Before Building

| Decision | Options | Recommendation | Lock-in Risk |
|---|---|---|---|
| **Cloud Provider for first deployment** | Any major public cloud or on-prem | See [`13-Multi-Cloud-Mapping.md`](./13-Multi-Cloud-Mapping.md) for selection criteria | Low (Kubernetes is portable) |
| **K8s Distribution** | Cloud-managed (preferred) vs self-managed | Managed — saves ops effort early; the cloud's managed Kubernetes service is industry standard everywhere | None |
| **Primary Region** | Major-cloud region close to first customers | Match where first paying customers are | None |
| **Service Mesh Day-1?** | Istio from day 1 vs add later | **Add later** — keep MVP simple | Low — Istio is additive |
| **API Gateway** | Kong vs Envoy Gateway vs NGINX Ingress | Kong — best developer portal and largest plugin ecosystem | Low |
| **Backend Language** | Node.js (TypeScript) / Java (Spring Boot) / Go | **Pick one industry-standard stack and standardize** | Low |
| **Frontend Stack** | React + TypeScript | React + TypeScript — industry standard | None |
| **Cloud Costs Budget** | $1K-$3K/mo for dev/staging | Plan for $2K/mo through MVP | — |

### 3.2 Minimum Viable Team

```mermaid
flowchart LR
    subgraph CORE["Core Team (5-7 people)"]
        TL["Tech Lead / Architect"]
        BE["Backend Engineers (2-3)"]
        FE["Frontend Engineer (1)"]
        DEVOPS["DevOps / SRE (1)"]
        PM["Product Manager"]
    end

    subgraph EXTENDED["Extended (as needed)"]
        SEC["Security Engineer<br/>(Phase 5)"]
        QA["QA Engineer<br/>(Phase 3+)"]
        UX["UX Designer<br/>(part-time)"]
    end

    classDef core fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef ext fill:#fef3c7,color:#92400e,stroke:#f59e0b

    class TL,BE,FE,DEVOPS,PM core
    class SEC,QA,UX ext
```

### 3.3 Repository Layout

```
learning-platform/                       (application code monorepo)
├── services/
│   ├── tenant-svc/
│   ├── identity-svc/
│   ├── profile-svc/
│   ├── ingestion-svc/
│   └── ... (12 services)
├── frontend/
│   └── react-app/
├── libs/
│   ├── shared-types/
│   ├── auth-client/
│   └── db-utils/
├── tests/
│   └── e2e/
├── .github/workflows/
└── docs/

learning-platform-config/                (GitOps repo)
├── argocd/
├── apps/                                (Helm values per service)
├── infra/                               (cert-manager, Kong, Vault, etc.)
└── databases/

learning-platform-terraform/             (infra IaC)
├── modules/
└── envs/
    ├── dev/
    ├── staging/
    └── prod-us/
```

---

## 4. Phase 1 — Foundation (Weeks 4-7)

**Goal:** Land the cloud-native platform; ready to deploy services.

### 4.1 Deliverables

| Deliverable | Owner | Definition of Done |
|---|---|---|
| Dev cluster on chosen cloud | DevOps | `kubectl get nodes` returns 3+ nodes |
| Staging cluster | DevOps | Same |
| ArgoCD bootstrapped | DevOps | ArgoCD UI accessible; root app synced |
| Harbor registry | DevOps | Image push/pull works |
| Vault deployed + initialized | DevOps | KV v2 mount enabled; K8s auth configured |
| Keycloak deployed | DevOps | Admin console accessible; first realm + IdP created |
| CloudNativePG operator + dev cluster | DevOps | Sample app can connect; HA verified by killing pod |
| Redis Operator + cluster | DevOps | Sentinel quorum healthy |
| MinIO cluster | DevOps | Bucket create / put / get works |
| Strimzi Kafka cluster | DevOps | Topic create + produce/consume works |
| Prometheus + Grafana + Loki + Tempo | DevOps | Default dashboards visible |
| cert-manager + Let's Encrypt | DevOps | Sample TLS cert auto-issued |
| Kong Gateway | DevOps | Sample ingress with JWT plugin works |
| Istio (optional) | DevOps | mTLS enabled cluster-wide if chosen |

### 4.2 Infrastructure as Code Order

```mermaid
flowchart TD
    TF["Terraform: cluster + network"]
    BS["kubectl apply argocd/bootstrap.yaml"]
    ARGO["ArgoCD owns everything else"]

    subgraph INFRA["ArgoCD installs in order"]
        I1["cert-manager"]
        I2["Vault"]
        I3["External Secrets Operator"]
        I4["CloudNativePG, Redis, Strimzi, MinIO operators"]
        I5["Database clusters"]
        I6["Keycloak"]
        I7["Kong Gateway"]
        I8["Observability stack"]
    end

    TF --> BS --> ARGO --> I1 --> I2 --> I3 --> I4 --> I5 --> I6 --> I7 --> I8

    classDef tf fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef gitops fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef infra fill:#dbeafe,color:#1e3a8a,stroke:#326ce5

    class TF tf
    class BS,ARGO gitops
    class I1,I2,I3,I4,I5,I6,I7,I8 infra
```

### 4.3 Exit Criteria

- A developer can: `git push` → CI builds image → push to Harbor → ArgoCD syncs → service runs on staging.
- A pod can read secrets from Vault, write to PostgreSQL, publish to Kafka, store a file in MinIO.
- Prometheus has metrics for the cluster; Grafana shows a default dashboard.

---

## 5. Phase 2 — Walking Skeleton (Weeks 8-11)

**Goal:** One narrow but **complete** use case in production — proves the architecture works end-to-end.

### 5.1 Chosen Walking Skeleton

**"A super-admin can create a tenant, the tenant admin can sign in via Keycloak, and they see an empty dashboard."**

This single flow validates:
- Frontend → CDN → Ingress → Kong → backend service → PostgreSQL
- Authentication via Keycloak (OIDC)
- JWT validation in Kong with `tenant_id` claim
- PostgreSQL RLS with tenant context
- Vault secret injection
- Observability (request shows up in traces + logs + metrics)
- CI/CD GitOps deploy
- Helm chart pattern for a service

### 5.2 What's IN Scope

| Item | In scope |
|---|---|
| `tenant-svc` — create tenant | YES (one endpoint: POST /tenants) |
| `frontend` — login + empty dashboard | YES |
| Keycloak realm with one user attribute mapper | YES |
| Kong JWT plugin | YES |
| PostgreSQL schema for `tenants` table only | YES |
| Vault secret for DB password | YES |
| ArgoCD app for `tenant-svc` + `frontend` | YES |

### 5.3 What's OUT of Scope (deferred)

- SSO federation (UC-04) — use local Keycloak users initially
- Subscription tiers (UC-03) — only one default tier
- Data ingestion (UC-05) — no data yet
- Notifications, audit log, billing — stubbed out

### 5.4 First Demo

End of Phase 2 = **stakeholder demo**:
1. Open admin URL → log in as super admin
2. Click "Create Tenant" → fill form → submit
3. Open tenant URL → log in as tenant admin → see empty dashboard
4. Open Grafana → show the trace of the entire flow
5. Open ArgoCD → show all syncing apps healthy

---

## 6. Phase 3 — Core MVP (Months 3-5)

**Goal:** First 6 use cases shippable. Beta with 3-5 friendly tenants.

### 6.1 Build Order (Vertical Slices)

```mermaid
flowchart LR
    UC1["UC-01<br/>Tenant Onboarding"]
    UC2["UC-02<br/>Super Admin Mgmt"]
    UC3["UC-03<br/>Subscription Tiers"]
    UC5["UC-05<br/>Data Ingestion"]
    UC6["UC-06<br/>Employee Profile"]
    UC12["UC-12<br/>Dashboard"]

    UC1 --> UC2 --> UC3
    UC3 --> UC5
    UC5 --> UC6
    UC6 --> UC12

    classDef uc fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    class UC1,UC2,UC3,UC5,UC6,UC12 uc
```

### 6.2 Per-Use-Case Output

| Use Case | Service(s) Built | Demo-Ready Output |
|---|---|---|
| UC-01 | `tenant-svc` | Self-service tenant signup form + email confirmation |
| UC-02 | `tenant-svc` (admin endpoints) | Super-admin can list/edit/suspend tenants |
| UC-03 | `billing-svc` (basic) | Tier change via admin UI; rate limiting works |
| UC-05 | `ingestion-svc`, Kafka, `profile-aggregator` | External API can POST training data; appears in DB |
| UC-06 | `profile-svc` | Employee detail page shows aggregated profile |
| UC-12 | `dashboard-api`, `frontend` widgets | Role-based dashboard with live KPIs |

### 6.3 Architecture Discipline

By end of Phase 3, the following patterns are codified:

| Pattern | Implementation |
|---|---|
| **Service Helm chart template** | All services follow same Chart structure |
| **PostgreSQL migration tool** | Atlas / golang-migrate / Alembic adopted |
| **Common auth library** | `auth-client` lib extracts tenant_id from JWT |
| **Standard error contract** | All services return same JSON error envelope |
| **OpenAPI spec per service** | Auto-generated from code, published to Kong |
| **Integration test harness** | Testcontainers spins up PG + Redis + Kafka |

### 6.4 Beta Launch Checklist

- [ ] 3-5 friendly tenants onboarded
- [ ] On-call rotation set up (PagerDuty)
- [ ] Status page (statuspage.io / Cachet)
- [ ] Customer support channel (email or Slack Connect)
- [ ] Bug-tracker integration to Slack
- [ ] Weekly retro with beta tenants

---

## 7. Phase 4 — Risk Engine & Intervention (Months 6-8)

**Goal:** Ship the differentiating value — proactive risk detection + intervention.

| Use Case | Service(s) | Key Risks |
|---|---|---|
| UC-04 SSO Federation | Keycloak IdP brokering | SAML metadata variations between IdPs |
| UC-07 Risk Rules | `rules-svc` | Rule grammar design — keep simple JSON for v1 |
| UC-08 Nightly Risk Batch | Argo Workflow + `risk-engine` worker | Performance with large tenants; staggered execution |
| UC-09 Intervention Assignment | `intervention-svc` | Approval workflow state machine complexity |
| UC-10 Effectiveness Tracking | `analytics-svc` | Statistical validity of pre/post comparison |

### 7.1 Risk Engine Iteration

Build the risk engine **incrementally**:

```mermaid
flowchart LR
    V1["v1 — Hard-coded rules<br/>(3 rules in code)"]
    V2["v2 — JSON-defined rules<br/>(no UI yet)"]
    V3["v3 — Rule builder UI<br/>(JSON output)"]
    V4["v4 — DSL or expression<br/>language (if needed)"]

    V1 --> V2 --> V3 -.->|"only if needed"| V4

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef maybe fill:#fef3c7,color:#92400e,stroke:#f59e0b,stroke-dasharray: 5 5

    class V1,V2,V3 step
    class V4 maybe
```

---

## 8. Phase 5 — Compliance & Production Hardening (Months 9-11)

| Stream | Owner | Output |
|---|---|---|
| **UC-11 Reports** | Backend team | PDF/Excel/CSV generation via `report-svc` Knative; pre-signed URLs |
| **SOC 2 Readiness** | Security + DevOps | Audit log immutability, access controls, vendor list, BCP/DR docs |
| **Performance Testing** | QA + SRE | k6 / Locust load tests — 500 concurrent users, sustained 10K req/min |
| **Chaos Engineering** | SRE | Chaos Mesh — pod kills, AZ failure, DB primary failover |
| **Security Hardening** | Security | Trivy + Grype scan all images; Falco rules; OPA Gatekeeper policies |
| **Per-Tenant Tier Enforcement** | Backend | Kong rate limits + DB triggers + app checks all aligned |
| **GDPR Readiness** | Security + Backend | Right to erasure script; data inventory; DPA template for customers |

### 8.1 Production Readiness Review (PRR) Checklist

Every service must pass a PRR before production rollout:

```mermaid
flowchart TD
    PRR["Production Readiness Review"]

    subgraph CHECK["Per-Service Checklist"]
        C1["Health + readiness probes implemented"]
        C2["Resource requests + limits set"]
        C3["HPA / KEDA configured"]
        C4["PodDisruptionBudget defined"]
        C5["NetworkPolicy applied"]
        C6["Metrics + logs + traces emitted"]
        C7["SLO defined + Sloth rule"]
        C8["Runbook documented"]
        C9["Vault secrets configured"]
        C10["Image signed + scanned"]
        C11["Integration tests passing"]
        C12["Load test results within SLO"]
    end

    PRR --> CHECK

    classDef prr fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef check fill:#dbeafe,color:#1e3a8a,stroke:#326ce5

    class PRR prr
    class C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12 check
```

---

## 9. Phase 6 — GA Launch (Month 12)

| Activity | Day |
|---|---|
| Final DR drill (simulated region failure) | T-14 |
| Performance test at 2× projected load | T-10 |
| Security pen test (external auditor) | T-7 |
| Status page green for 7 days | T-7 → T-0 |
| Customer-facing documentation live | T-3 |
| Marketing launch | T-0 |
| 24×7 on-call rotation active | T-0 onwards |
| Post-launch retrospective | T+14 |

---

## 10. Optional Add-Ons (Post-GA)

These are not blockers for GA — add as growth demands.

| Capability | Trigger to Add | Estimated Effort |
|---|---|---|
| **Service Mesh (Istio)** | When 15+ services or zero-trust required | 6 weeks |
| **Multi-region** | When >50% traffic outside primary region | 8 weeks |
| **Cross-cloud DR** | When customer demands or vendor risk concern | 6 weeks |
| **ML-based risk scoring** | When customers want predictive (not just rule-based) | 12+ weeks |
| **API Marketplace / Developer Portal** | When self-serve API key flow needed | 4 weeks |
| **White-label / on-prem deployment** | When enterprise customer requires it | 8 weeks |
| **Analytics warehouse (ClickHouse)** | When cross-tenant analytics + reports slow PG | 6 weeks |

---

## 11. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **K8s ramp-up too slow** | Medium | High | Bring in 1 K8s consultant for Phase 1; pair with team |
| **Cloud costs balloon** | Medium | Medium | Set budget alerts in cloud account; weekly OpenCost review |
| **Picking wrong cloud** | Low | High | Decision documented in ADR; portable design means low switching cost |
| **Keycloak operational complexity** | Medium | Medium | Use Bitnami Helm chart; vendor support optional |
| **OSS supply chain attacks** | Medium | High | Cosign signing, SBOM, Trivy scans, pinned versions |
| **Performance issues at scale** | Medium | High | Continuous load testing from Phase 3 onwards |
| **Compliance gaps** | Low | High | SOC 2 audit early (Phase 5); GDPR DPO consultation |
| **Single point of knowledge** | High | High | Pair programming; architecture docs in Git; rotation |

---

## 12. Resource & Budget Plan

### 12.1 Team Cost (12 months)

| Role | Count | Avg Loaded Cost (USD/mo) | Total (12 mo) |
|---|---|---|---|
| Tech Lead / Architect | 1 | $18,000 | $216,000 |
| Backend Engineers | 3 | $15,000 | $540,000 |
| Frontend Engineer | 1 | $13,000 | $156,000 |
| DevOps / SRE | 1 | $16,000 | $192,000 |
| Product Manager | 1 | $14,000 | $168,000 |
| Security Engineer (50% from Phase 5) | 0.5 | $17,000 | $51,000 |
| QA Engineer (from Phase 3) | 1 | $11,000 | $110,000 |
| **Team Subtotal** | | | **$1,433,000** |

### 12.2 Infrastructure Cost (12 months)

| Phase | Monthly | Months | Subtotal |
|---|---|---|---|
| Phase 0-1 (dev only) | $500 | 2 | $1,000 |
| Phase 2-3 (dev + staging) | $1,000 | 4 | $4,000 |
| Phase 4-5 (dev + staging + small prod) | $1,500 | 4 | $6,000 |
| Phase 6 (full production) | $2,500 | 2 | $5,000 |
| **Infra Subtotal** | | | **$16,000** |

### 12.3 External Services (12 months)

| Item | Annual |
|---|---|
| GitHub Team | $1,200 |
| PagerDuty | $2,400 |
| Sentry / Error tracking (optional) | $3,000 |
| Twilio (SMS) seed | $500 |
| SendGrid (Email) | $1,200 |
| Pen test (one-time) | $15,000 |
| SOC 2 audit (one-time) | $25,000 |
| **External Subtotal** | | **$48,300** |

### 12.4 Grand Total

| Category | Year 1 |
|---|---|
| Team | $1,433,000 |
| Infrastructure | $16,000 |
| External services | $48,300 |
| **TOTAL Year 1** | **~$1,497,000** |

> Compare to: typical SaaS startup spends $1.5-2M to reach GA. This is on the lower end because cloud-native + GitOps reduces operational burden significantly.

---

## 13. Decision Points (When to Re-Evaluate)

| Milestone | Re-Evaluate |
|---|---|
| End of Phase 1 | Is cloud choice still right? Any architectural surprises? |
| End of Phase 3 (beta) | Are SLOs realistic? Right team size? Build-vs-buy decisions? |
| End of Phase 5 (PRR) | Performance test results — scale-up plan? |
| GA + 6 months | Multi-region needed? More services? |

---

## 14. Definition of "Done" per Phase

| Phase | Done When |
|---|---|
| 0 | All architectural decisions documented in ADRs; team hired; repos initialized |
| 1 | Engineer can deploy a hello-world via GitOps in <30 min |
| 2 | Walking skeleton demo passes stakeholder review |
| 3 | 3+ beta tenants actively using the platform |
| 4 | Risk batch successfully evaluates all beta tenants for 14 consecutive nights |
| 5 | PRR passes for all 12 services; load test sustains 2× projected GA traffic |
| 6 | Public launch; first paying customer; on-call drill completed |
