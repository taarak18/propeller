# 10 · Multi-Region Deployment & Disaster Recovery

> Cloud-native multi-region strategy with **active-active for read** and **active-passive for write**. Supports cross-cloud failover (e.g., AWS primary → GCP DR) — impossible with Azure-only design.

---

## 1. Regional Topology

```mermaid
flowchart TB
    subgraph GLOBAL["Global Layer"]
        GDNS["GeoDNS<br/>(Cloudflare / Route53 /<br/>Cloud DNS)"]
        GCDN["Anycast CDN<br/>(Cloudflare / Fastly /<br/>CloudFront)"]
    end

    subgraph PRIMARY["Region: us-east<br/>(Primary — India + AMER)"]
        direction TB
        K8S_US["Kubernetes Cluster<br/>(3 AZ, 6 worker nodes)"]
        PG_US[("PostgreSQL Primary<br/>+ Sync Standby (AZ-b)<br/>+ Async Replica (AZ-c)")]
        MINIO_US[("MinIO Cluster<br/>4+2 erasure across AZs")]
        KAFKA_US[("Kafka 3 brokers<br/>1 per AZ")]
        REDIS_US[("Redis Sentinel<br/>HA across AZs")]
    end

    subgraph EU["Region: eu-west<br/>(EU-only — GDPR)"]
        direction TB
        K8S_EU["K8s Cluster"]
        PG_EU[("PostgreSQL<br/>independent of US<br/>(data residency)")]
        MINIO_EU[("MinIO<br/>(EU data only)")]
        KAFKA_EU[("Kafka")]
    end

    subgraph DR["Region: us-central<br/>(Warm DR)"]
        direction TB
        K8S_DR["K8s Cluster<br/>(scaled to 0)"]
        PG_DR[("PostgreSQL Async Replica<br/>RPO: 1hr · RTO: 4hr")]
        MINIO_DR[("MinIO Geo-Replication Target")]
    end

    subgraph GITOPS["Global GitOps"]
        REPO["Git Repository<br/>(GitHub / GitLab)"]
        ARGOCD["ArgoCD<br/>multi-cluster sync"]
    end

    GDNS --> GCDN
    GCDN -- "India + AMER<br/>(latency-based)" --> K8S_US
    GCDN -- "EU traffic" --> K8S_EU
    GCDN -. "failover if<br/>us-east down" .-> K8S_DR

    PG_US -. "WAL streaming<br/>(continuous)" .-> PG_DR
    MINIO_US -. "site replication" .-> MINIO_DR

    ARGOCD -.-> K8S_US
    ARGOCD -.-> K8S_EU
    ARGOCD -.-> K8S_DR
    REPO --> ARGOCD

    classDef global fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef primary fill:#dbeafe,color:#1e3a8a,stroke:#326ce5,stroke-width:2px
    classDef eu fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef dr fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef gitops fill:#f3e8ff,color:#581c87,stroke:#9333ea

    class GDNS,GCDN global
    class K8S_US,PG_US,MINIO_US,KAFKA_US,REDIS_US primary
    class K8S_EU,PG_EU,MINIO_EU,KAFKA_EU eu
    class K8S_DR,PG_DR,MINIO_DR dr
    class REPO,ARGOCD gitops
```

---

## 2. Data Residency Rules

| Tenant Region | Routes To | Data Stays In | Compliance |
|---|---|---|---|
| India | us-east | us-east | RBI guidelines on US storage allowed |
| AMER (US/CA/MX) | us-east | us-east | CCPA, HIPAA-ready |
| EU (27 countries) | eu-west | eu-west **only** | GDPR — no replication outside EU |
| APAC (future) | ap-south | ap-south | Per-country regulations |

Routing is enforced at the **CDN / GeoDNS layer**, NOT in application code, so a misconfigured app can never accidentally route EU traffic to US.

```mermaid
flowchart TD
    REQ["Incoming Request"]
    DNS{"GeoDNS lookup<br/>(client country)"}
    REQ --> DNS
    DNS -- "EU country" --> EU_CDN["EU CDN PoP"]
    DNS -- "Non-EU" --> US_CDN["Global CDN PoP"]
    EU_CDN --> EU_K["eu-west cluster"]
    US_CDN --> US_K["us-east cluster"]
    US_K -. "fallback if down" .-> DR_K["us-central DR"]

    classDef route fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef eu fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef us fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef dr fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class DNS,EU_CDN,US_CDN route
    class EU_K eu
    class US_K us
    class DR_K dr
```

---

## 3. Replication Strategy per Data Store

### 3.1 PostgreSQL

```mermaid
flowchart LR
    subgraph PRIMARY["us-east"]
        P[("Primary<br/>read-write")]
        SS[("Sync Standby<br/>(zero data loss)")]
        AS[("Async Standby<br/>(read replica)")]
        P -- "sync" --> SS
        P -- "async" --> AS
    end

    subgraph DR_REGION["us-central"]
        DR[("Async Replica<br/>(cross-region)")]
    end

    subgraph EU_REGION["eu-west"]
        EUP[("EU Primary<br/>(independent)")]
        EUS[("EU Sync Standby")]
        EUP -- "sync" --> EUS
    end

    P -- "async streaming<br/>over private link" --> DR

    classDef primary fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef standby fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef dr fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef eu fill:#dcfce7,color:#14532d,stroke:#16a34a

    class P primary
    class SS,AS standby
    class DR dr
    class EUP,EUS eu
```

**Configuration:**
- **Sync replication** within region — zero data loss for hot failover
- **Async streaming** to DR region — RPO of seconds
- **EU PostgreSQL is independent** — no replication to non-EU regions (GDPR)

### 3.2 MinIO Site Replication

```yaml
# MinIO multi-site replication setup
mc admin replicate add  \
    us-east http://minio-us:9000 \
    us-central http://minio-dr:9000 \
    --replicate "delete,delete-marker,replica-metadata-sync"
```

- **Same-region replication:** Erasure coding across AZs (within cluster)
- **Cross-region replication:** Async site replication to DR
- **EU bucket replication:** Disabled — EU buckets stay in eu-west only

### 3.3 Kafka MirrorMaker 2

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaMirrorMaker2
metadata:
  name: us-to-dr-mirror
spec:
  version: 3.6.0
  replicas: 2
  connectCluster: "us-east"
  clusters:
    - alias: us-east
      bootstrapServers: kafka-us.data:9092
    - alias: us-central
      bootstrapServers: kafka-dr.data:9092
  mirrors:
    - sourceCluster: us-east
      targetCluster: us-central
      sourceConnector:
        config:
          replication.factor: 3
          sync.topic.acls.enabled: true
      topicsPattern: ".*"
      topicsExcludePattern: "internal-.*"
```

### 3.4 MongoDB Cross-Region Replica Set

```yaml
# 3-node replica set spanning 2 regions
members:
  - host: mongo-1.us-east.svc.cluster.local:27017
    priority: 2     # primary candidate
  - host: mongo-2.us-east.svc.cluster.local:27017
    priority: 1
  - host: mongo-3.us-central.svc.cluster.local:27017
    priority: 0     # DR — never primary
    hidden: true
    votes: 1
```

---

## 4. Disaster Recovery Tiers

| Tier | RPO | RTO | Cost | Use Case |
|---|---|---|---|---|
| **Hot DR** (active-active) | Near-zero | Near-zero | High (3× cost) | Mission-critical, public sector |
| **Warm DR** (this design) | 1hr | 4hr | Medium (1.3× cost) | Standard enterprise SaaS |
| **Cold DR** (backup only) | 24hr | 24hr+ | Low (1.1× cost) | Dev/staging environments |

> The cloud-native design supports **all three tiers** — choose per environment via Helm values.

---

## 5. Failover Procedures

### 5.1 Single Pod Failure
Automatic — K8s reschedules pod elsewhere within seconds. PodDisruptionBudget ensures min replicas.

### 5.2 Single AZ Failure
Automatic — pods reschedule to surviving AZs. PostgreSQL syncs to standby in another AZ; failover via CNPG operator within 30s.

### 5.3 Whole Region Failure (us-east → us-central failover)

```mermaid
sequenceDiagram
    participant Detect as Monitoring
    participant Ops as On-Call Engineer
    participant DNS as GeoDNS
    participant PG as PostgreSQL DR
    participant K8s as us-central K8s
    participant ArgoCD as ArgoCD
    participant Users as Users

    Detect->>Ops: Page: us-east unreachable
    Ops->>Ops: Confirm region outage<br/>(check cloud status page)
    Ops->>PG: Promote DR replica to primary<br/>(CNPG: kubectl cnpg promote)
    PG-->>Ops: Promoted in ~30s
    Ops->>K8s: Scale up app deployments<br/>(was at 0 replicas)
    K8s-->>Ops: Pods ready in 2-3min
    Ops->>ArgoCD: Verify app health via ArgoCD UI
    ArgoCD-->>Ops: All apps Healthy
    Ops->>DNS: Update GeoDNS:<br/>us-east → us-central
    DNS-->>Users: TTL-based propagation (60s)
    Users->>K8s: New requests served from us-central

    Note over Detect,Users: Total RTO: ~5-15 min
```

### 5.4 Failback Procedure

After us-east is restored:

```bash
# 1. Restore PG primary in us-east (was replica during failover)
kubectl cnpg promote pg-us-east --no-wait

# 2. Re-sync data: us-central → us-east
# (CNPG handles this via streaming)

# 3. Wait for replication lag to be <1s
kubectl cnpg status pg-us-east

# 4. Scale up apps in us-east
kubectl scale deploy --all --replicas=3 -n app

# 5. Update GeoDNS back to us-east
# 6. Scale down us-central (back to DR posture)
kubectl scale deploy --all --replicas=0 -n app  # in us-central
```

---

## 6. Multi-Cluster Service Mesh (Optional Advanced)

For **true active-active** across regions, Istio multi-cluster:

```mermaid
flowchart TB
    subgraph US["us-east cluster"]
        US_C["istiod (primary)"]
        US_W["Workloads"]
    end

    subgraph DR["us-central cluster"]
        DR_C["istiod (remote)"]
        DR_W["Workloads"]
    end

    SVCEXP["ServiceExport CRD<br/>(MCS)"]
    US_C <-->|"shared root CA<br/>cross-cluster mTLS"| DR_C
    US_W <-->|"transparent failover<br/>via locality LB"| DR_W
    SVCEXP -.-> US_W
    SVCEXP -.-> DR_W

    classDef ctrl fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef wl fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef crd fill:#f3e8ff,color:#581c87,stroke:#9333ea

    class US_C,DR_C ctrl
    class US_W,DR_W wl
    class SVCEXP crd
```

**Trade-offs:**
- **Pro:** Sub-second failover; geographically aware load balancing.
- **Con:** Higher complexity; cross-cluster TLS rotation; egress charges.

For most SaaS workloads, the **warm-DR pattern** is the right balance.

---

## 7. Backup Strategy

```mermaid
flowchart TB
    subgraph SOURCE["Production"]
        PG_LIVE[("PostgreSQL")]
        MONGO_LIVE[("MongoDB")]
        MINIO_LIVE[("MinIO")]
        K8S_OBJ["K8s objects"]
        VAULT_LIVE[("Vault")]
    end

    subgraph TOOLS["Backup Tools"]
        CNPG_BAK["CNPG Backup<br/>(WAL + base)"]
        PBM["Percona Backup<br/>for MongoDB"]
        MC["MinIO Client<br/>mc mirror"]
        VELERO["Velero<br/>(K8s + PVC)"]
        VAULT_BAK["Vault Raft<br/>snapshot"]
    end

    subgraph DESTINATIONS["Backup Destinations"]
        MINIO_BAK[("MinIO Backup Bucket<br/>(separate cluster)")]
        EXTERNAL[("External S3 / GCS / B2<br/>(belt-and-braces)")]
    end

    PG_LIVE --> CNPG_BAK --> MINIO_BAK
    MONGO_LIVE --> PBM --> MINIO_BAK
    MINIO_LIVE --> MC --> EXTERNAL
    K8S_OBJ --> VELERO --> MINIO_BAK
    VAULT_LIVE --> VAULT_BAK --> EXTERNAL

    MINIO_BAK -- "weekly export" --> EXTERNAL

    classDef live fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef tool fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef dest fill:#dcfce7,color:#14532d,stroke:#16a34a

    class PG_LIVE,MONGO_LIVE,MINIO_LIVE,K8S_OBJ,VAULT_LIVE live
    class CNPG_BAK,PBM,MC,VELERO,VAULT_BAK tool
    class MINIO_BAK,EXTERNAL dest
```

| Resource | Tool | Frequency | Retention | RPO | RTO |
|---|---|---|---|---|---|
| PostgreSQL | CloudNativePG | WAL continuous + daily base | 30 days hot + 1 year cold | 5min | 30min |
| MongoDB | Percona Backup | Daily | 30 days | 24hr | 1hr |
| MinIO | mc mirror | Continuous (site replication) | 7-10 years (tier-based) | 15min | 1hr |
| Redis | RDB snapshot | Every 60min | 7 days | 1hr | 15min |
| K8s manifests | GitOps | Continuous | Git history (forever) | 0 | 30min |
| Vault | Raft snapshot | Every 6hr | 7 days | 6hr | 30min |
| Kafka | MirrorMaker 2 | Continuous | Same as primary | <1min | <5min |

---

## 8. DR Testing — Game Days

Quarterly DR drill checklist:

```mermaid
flowchart LR
    PLAN["Plan game day<br/>(schedule maintenance window)"]
    SIM["Simulate failure<br/>(e.g., chaos-mesh kills us-east AZ-a)"]
    OBSERVE["Observe automated recovery<br/>(metrics, traces, logs)"]
    MANUAL["Manual failover drill<br/>(promote DR replica)"]
    VERIFY["Verify functionality<br/>(smoke tests against DR region)"]
    RESTORE["Restore to normal state<br/>(failback)"]
    POSTMORTEM["Document findings<br/>(update runbook)"]

    PLAN --> SIM --> OBSERVE --> MANUAL --> VERIFY --> RESTORE --> POSTMORTEM

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    class PLAN,SIM,OBSERVE,MANUAL,VERIFY,RESTORE,POSTMORTEM step
```

Tools: **Chaos Mesh** or **LitmusChaos** for controlled failure injection.

---

## 9. Cross-Cloud Failover (Bonus)

A unique advantage of cloud-native: **switch cloud providers mid-flight**.

```mermaid
flowchart LR
    NORMAL["Normal Ops:<br/>AWS us-east"]
    OUTAGE["AWS outage<br/>(e.g., region-wide)"]
    FAILOVER["Failover to GCP DR"]
    GCP["Workloads running<br/>on GCP cluster"]
    RECOVERED["AWS restored"]
    FAILBACK["Failback to AWS"]

    NORMAL --> OUTAGE --> FAILOVER --> GCP --> RECOVERED --> FAILBACK --> NORMAL

    classDef normal fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef outage fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    classDef fail fill:#fef3c7,color:#92400e,stroke:#f59e0b

    class NORMAL,RECOVERED normal
    class OUTAGE outage
    class FAILOVER,GCP,FAILBACK fail
```

Requirements for cross-cloud DR:
1. **PostgreSQL streaming over VPN/private link** between clouds
2. **MinIO site replication** to GCS or another MinIO cluster
3. **GeoDNS provider that supports multiple cloud endpoints** (Cloudflare, NS1, Route53)
4. **Container images mirrored** across cloud registries (Harbor pull-through)

> This is the ultimate vendor lock-in escape hatch — impossible with Azure-only design.

---

## 10. Compliance & Audit

Every failover event is recorded:

| Event | Recorded In | Used For |
|---|---|---|
| DNS routing change | Cloudflare audit log + Git commit | Compliance reporting |
| PG promotion | CNPG K8s events + Loki | RTO/RPO measurement |
| Backup execution | Velero logs + Prometheus metric | Validate retention policy |
| DR drill outcome | Confluence + post-mortem doc | SOC 2 evidence |
| Failed health check | Prometheus + Alertmanager | Trigger investigation |

---

## 11. Summary Table

| Capability | Cloud-Coupled Baseline | Cloud-Portable Design |
|---|---|---|
| **Multi-region** | 2 regions within one vendor | Any 2+ regions across any cloud(s) |
| **Cross-cloud failover** | Not possible | Yes, with VPN / private link |
| **Data residency (GDPR)** | One vendor's EU region | Any EU region of any cloud |
| **Region failure RTO** | 4 hr (vendor traffic manager) | 5–15 min (managed GeoDNS + auto-scale) |
| **Active-active multi-region** | Limited (only certain vendor-specific stores) | Full (Istio multi-cluster + Postgres logical replication + Kafka MirrorMaker) |
| **Bare-metal DR** | Not possible | Yes (on-prem cluster) |
| **Customer-self-hosted DR** | Not possible | Yes (export same Helm charts to customer K8s) |
