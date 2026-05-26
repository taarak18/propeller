# 07 · Batch Processing & Event-Driven Architecture

> The platform uses **Apache Kafka** — the industry-standard event-streaming platform — for both async messaging and event streaming, with **Knative + KEDA + Argo Workflows** for serverless workloads, autoscaling, and stateful workflows. Kafka can be deployed as a managed service from the chosen cloud provider, or self-hosted via the Strimzi operator in Kubernetes; the application code is identical.

---

## 1. Component Roles

| Component | Purpose | Deployment Pattern |
|---|---|---|
| **Apache Kafka** | Async messaging + event streaming (unified) | Cloud-provider managed Kafka *(recommended)* or self-hosted via Strimzi operator |
| **Knative Eventing** | CloudEvents-based routing, source/sink abstraction | Self-managed in cluster |
| **KEDA** | Scale workers from zero based on queue depth | Self-managed in cluster |
| **Argo Workflows** | Stateful, multi-step workflows with retries | Self-managed in cluster |
| **Knative Serving** | Scale-to-zero HTTP services | Self-managed in cluster |

> All components above are industry-standard. **Kafka** is run at scale by LinkedIn, Netflix, Uber, Goldman Sachs, and most of the Fortune 100; **Knative** is the standard for K8s-native serverless (used by IBM Cloud, SAP, and others); **KEDA** is a CNCF graduated project widely deployed at enterprise scale.

---

## 2. Event Streaming Architecture

```mermaid
flowchart LR
    subgraph SOURCES["Event Sources"]
        S1["ingestion-svc<br/>(API → Kafka)"]
        S2["tenant-svc<br/>(lifecycle events)"]
        S3["intervention-svc<br/>(state changes)"]
        S4["risk-engine<br/>(alerts)"]
    end

    subgraph KAFKA["Apache Kafka (Strimzi)"]
        T1[("training.attendance.v1")]
        T2[("training.assessment.v1")]
        T3[("tenant.lifecycle.v1")]
        T4[("intervention.events.v1")]
        T5[("risk.alerts.v1")]
        T6[("notifications.outbound.v1")]
        T7[("audit.firehose.v1")]
        T8[("billing.events.v1")]
        SR["Schema Registry<br/>Avro / Protobuf / JSON Schema"]
    end

    subgraph CONSUMERS["Stream Consumers"]
        PA["profile-aggregator<br/>Deployment + KEDA"]
        RE["risk-engine-realtime<br/>Knative Eventing"]
        NW["notification-worker<br/>Deployment + KEDA"]
        AW["audit-worker<br/>Deployment + KEDA"]
        AN["analytics-svc<br/>(streaming aggregations)"]
    end

    subgraph SINKS["Downstream Sinks"]
        PG[("PostgreSQL")]
        MONGO[("MongoDB")]
        CH[("ClickHouse")]
        SMTP["SMTP Relay"]
        SMS["SMS Gateway"]
    end

    S1 --> T1 & T2
    S2 --> T3
    S3 --> T4
    S4 --> T5
    SR -.->|"validate"| T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8

    T1 & T2 --> PA --> PG
    T1 & T2 --> AN --> CH
    T5 --> RE --> T6
    T6 --> NW --> SMTP & SMS
    T1 & T2 & T3 & T4 & T5 & T6 & T8 --> AW --> MONGO

    classDef src fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef topic fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef cons fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef sink fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef sr fill:#fde68a,color:#92400e,stroke:#d97706

    class S1,S2,S3,S4 src
    class T1,T2,T3,T4,T5,T6,T7,T8 topic
    class PA,RE,NW,AW,AN cons
    class PG,MONGO,CH,SMTP,SMS sink
    class SR sr
```

---

## 3. UC-08 — Nightly Risk Evaluation Workflow

### 3.1 High-Level Flow

```mermaid
flowchart TD
    CRON["Argo CronWorkflow<br/>schedule: 0 1 * * *<br/>(01:00 UTC daily)"]
    FETCH["Step: fetch-active-tenants<br/>SELECT id FROM tenants<br/>WHERE status='ACTIVE'"]
    FANOUT["Fanout via withParam:<br/>1 sub-workflow per tenant<br/>(parallelism: 50)"]

    subgraph TENANT_WF["Per-Tenant Sub-Workflow"]
        T1["load-rules<br/>SELECT * FROM risk_rules<br/>WHERE tenant_id=? AND is_active"]
        T2["load-profiles<br/>Paginated 1000 at a time<br/>(via parallel steps)"]
        T3["evaluate-rules<br/>Per employee, run all rules<br/>(Knative-scaled workers)"]
        T4["compute-risk-score<br/>Composite scoring<br/>CRITICAL / HIGH / MEDIUM / LOW"]
        T5["upsert-assessments<br/>INSERT ON CONFLICT UPDATE"]
        T6["publish-alerts<br/>Produce to risk.alerts.v1"]
        T1 --> T2 --> T3 --> T4 --> T5 --> T6
    end

    SUMMARY["Final step:<br/>aggregate metrics across tenants<br/>(employees evaluated, alerts generated)"]
    NOTIFY["Notify ops<br/>(Slack / PagerDuty<br/>if any tenant failed)"]

    CRON --> FETCH --> FANOUT --> TENANT_WF
    TENANT_WF --> SUMMARY --> NOTIFY

    classDef cron fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef wf fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef final fill:#dcfce7,color:#14532d,stroke:#16a34a

    class CRON cron
    class FETCH,FANOUT,T1,T2,T3,T4,T5,T6 step
    class TENANT_WF wf
    class SUMMARY,NOTIFY final
```

### 3.2 Full Argo CronWorkflow Manifest

```yaml
apiVersion: argoproj.io/v1alpha1
kind: CronWorkflow
metadata:
  name: nightly-risk-evaluation
  namespace: batch
spec:
  schedule: "0 1 * * *"
  timezone: "UTC"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  workflowSpec:
    entrypoint: evaluate-all-tenants
    serviceAccountName: risk-engine-sa
    parallelism: 50
    activeDeadlineSeconds: 7200    # 2hr SLA
    podGC:
      strategy: OnWorkflowSuccess

    templates:
      - name: evaluate-all-tenants
        steps:
          - - name: fetch-tenants
              template: fetch-active-tenants
          - - name: per-tenant
              template: evaluate-tenant
              arguments:
                parameters:
                  - name: tenant-id
                    value: "{{item}}"
              withParam: "{{steps.fetch-tenants.outputs.result}}"
          - - name: summary
              template: aggregate-metrics
              arguments:
                parameters:
                  - name: results
                    value: "{{steps.per-tenant.outputs.result}}"

      - name: fetch-active-tenants
        script:
          image: harbor.platform.com/learning/risk-engine:1.0.0
          command: [python]
          source: |
            import psycopg2, json
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            cur = conn.cursor()
            cur.execute("SELECT id FROM tenants WHERE status='ACTIVE'")
            tenant_ids = [str(row[0]) for row in cur.fetchall()]
            print(json.dumps(tenant_ids))

      - name: evaluate-tenant
        inputs:
          parameters:
            - name: tenant-id
        retryStrategy:
          limit: 3
          retryPolicy: OnFailure
          backoff:
            duration: "30s"
            factor: 2
        container:
          image: harbor.platform.com/learning/risk-engine:1.0.0
          command: [python, /app/evaluate.py]
          args: ["--tenant-id={{inputs.parameters.tenant-id}}"]
          envFrom:
            - secretRef: { name: risk-engine-secrets }

      - name: aggregate-metrics
        inputs:
          parameters:
            - name: results
        container:
          image: harbor.platform.com/learning/risk-engine:1.0.0
          command: [python, /app/aggregate.py]
```

### 3.3 Per-Tenant Evaluation Logic

```python
def evaluate_tenant(tenant_id):
    with db.transaction():
        db.execute("SET LOCAL app.tenant_id = %s", (tenant_id,))

        rules = db.fetchall(
            "SELECT * FROM risk_rules WHERE tenant_id=%s AND is_active=true",
            (tenant_id,)
        )
        if not rules:
            return {"tenant_id": tenant_id, "skipped": True}

        job_id = db.fetchone(
            "INSERT INTO risk_evaluation_jobs "
            "(tenant_id, evaluation_date, status, started_at) "
            "VALUES (%s, CURRENT_DATE, 'RUNNING', NOW()) "
            "RETURNING id", (tenant_id,)
        )[0]

        alerts_generated = 0
        page_size = 1000
        offset = 0
        while True:
            profiles = db.fetchall(
                "SELECT * FROM employee_learning_profiles "
                "WHERE tenant_id=%s LIMIT %s OFFSET %s",
                (tenant_id, page_size, offset)
            )
            if not profiles:
                break

            for profile in profiles:
                fired_rules = []
                for rule in rules:
                    if evaluate_rule(rule, profile):
                        fired_rules.append({
                            "rule_id": rule["id"],
                            "rule_code": rule["rule_code"],
                            "severity": rule["severity"]
                        })

                risk_level = compute_composite_risk(fired_rules)
                previous = db.fetchone(
                    "SELECT risk_level FROM risk_assessments "
                    "WHERE tenant_id=%s AND employee_id=%s "
                    "ORDER BY assessed_at DESC LIMIT 1",
                    (tenant_id, profile["employee_id"])
                )

                db.execute(
                    "INSERT INTO risk_assessments "
                    "(tenant_id, employee_id, evaluation_job_id, "
                    " risk_level, rules_fired, previous_risk_level) "
                    "VALUES (%s, %s, %s, %s, %s::jsonb, %s)",
                    (tenant_id, profile["employee_id"], job_id,
                     risk_level, json.dumps(fired_rules),
                     previous[0] if previous else None)
                )

                if risk_level in ("CRITICAL", "HIGH"):
                    kafka_producer.send(
                        "risk.alerts.v1",
                        key=tenant_id.encode(),
                        value={
                            "tenant_id": tenant_id,
                            "employee_id": str(profile["employee_id"]),
                            "risk_level": risk_level,
                            "fired_rules": fired_rules,
                            "previous_level": previous[0] if previous else None,
                        }
                    )
                    alerts_generated += 1

            offset += page_size

        db.execute(
            "UPDATE risk_evaluation_jobs SET status='COMPLETED', "
            "completed_at=NOW(), alerts_generated=%s WHERE id=%s",
            (alerts_generated, job_id)
        )

    return {"tenant_id": tenant_id, "alerts": alerts_generated}
```

---

## 4. UC-05 — Real-Time Data Ingestion

```mermaid
sequenceDiagram
    autonumber
    participant EXT as External LMS
    participant K as Kong Gateway
    participant IG as ingestion-svc
    participant RD as Redis
    participant KAFKA as Kafka<br/>training.attendance.v1
    participant PA as profile-aggregator
    participant PG as PostgreSQL
    participant CACHE as Redis (profile cache)

    EXT->>K: POST /api/v1/ingest/attendance<br/>X-API-Key: sk_...<br/>{records: [...]}
    K->>K: Validate API key (Kong key-auth)
    K->>K: Rate limit (1000/min for Pro tier)
    K->>IG: Forward + X-Tenant-Id header
    IG->>IG: Validate schema (JSON Schema)
    IG->>RD: SETNX ingestion:idem:{tenant}:{req_id}
    alt Duplicate
        IG-->>EXT: 200 {status: duplicate}
    else New
        loop For each record
            IG->>KAFKA: Produce (partition key=tenant_id)
        end
        IG-->>EXT: 202 Accepted {received: N}
    end

    Note over KAFKA,PA: Async, parallel consumption
    KAFKA->>PA: Consume batch (50 records)
    PA->>PG: SET LOCAL app.tenant_id; INSERT records
    PA->>PG: Recompute employee_learning_profiles<br/>(UPSERT)
    PA->>CACHE: DEL profile:{tenant}:{employee_id}
    PA->>KAFKA: Commit consumer offset
```

### 4.1 KEDA Scaler for profile-aggregator

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: profile-aggregator-scaler
  namespace: app
spec:
  scaleTargetRef:
    name: profile-aggregator
  minReplicaCount: 0
  maxReplicaCount: 30
  pollingInterval: 15
  cooldownPeriod: 300
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka.data:9092
        consumerGroup: profile-aggregator-cg
        topic: training.attendance.v1
        lagThreshold: "100"
        offsetResetPolicy: latest
```

---

## 5. UC-11 — Async Report Generation

### 5.1 End-to-End Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant K as Kong
    participant API as report-svc (sync API)
    participant PG as PostgreSQL
    participant KAFKA as Kafka report.jobs
    participant KN as report-worker (Knative)
    participant MINIO as MinIO
    participant CENT as Centrifugo<br/>(WebSocket)

    U->>K: POST /api/v1/reports {type:PDF, period:Q3}
    K->>API: Forward (JWT validated)
    API->>PG: INSERT report_jobs (status=PENDING)
    API->>KAFKA: Produce {job_id, tenant_id, params}
    API-->>U: 202 Accepted {job_id, status_url}

    Note over KN: KEDA scales 0→N based on Kafka lag

    KAFKA->>KN: Consume job
    KN->>PG: SET LOCAL app.tenant_id; SELECT data
    KN->>KN: Render PDF (Gotenberg / wkhtmltopdf)
    KN->>MINIO: PUT reports/{tenant}/{job}.pdf
    MINIO-->>KN: ETag
    KN->>MINIO: Generate pre-signed URL (24h)
    KN->>PG: UPDATE report_jobs status=COMPLETED, url=?
    KN->>CENT: Publish to channel user:{user_id}
    CENT-->>U: WebSocket push "Report ready: [Download]"

    U->>API: GET /api/v1/reports/{job_id}
    API->>PG: SELECT * FROM report_jobs
    API-->>U: 200 {url, expires_at}
    U->>MINIO: GET <pre-signed URL>
    MINIO-->>U: PDF bytes
```

### 5.2 Knative Service for report-worker

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: report-worker
  namespace: batch
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "0"
        autoscaling.knative.dev/max-scale: "30"
        autoscaling.knative.dev/target: "5"   # 5 concurrent requests per pod
    spec:
      containerConcurrency: 5
      timeoutSeconds: 600
      containers:
        - image: harbor.platform.com/learning/report-worker:1.0.0
          resources:
            requests: { cpu: 500m, memory: 1Gi }
            limits:   { cpu: 2,    memory: 4Gi }
          env:
            - name: MINIO_ENDPOINT
              value: minio.data:9000
```

### 5.3 Knative Eventing — Kafka Source

```yaml
apiVersion: sources.knative.dev/v1beta1
kind: KafkaSource
metadata:
  name: report-jobs-source
  namespace: batch
spec:
  consumerGroup: report-worker-cg
  bootstrapServers: [kafka.data:9092]
  topics: [report.jobs.v1]
  sink:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: report-worker
```

When a message lands on `report.jobs.v1`, Knative Eventing invokes the Knative service, which scales from 0 → N → 0 automatically.

---

## 6. Notification Dispatch Pipeline

```mermaid
flowchart LR
    SRC1["risk-engine"]
    SRC2["intervention-svc"]
    SRC3["report-worker"]
    SRC4["billing-svc"]

    KAFKA[("Kafka:<br/>notifications.outbound.v1<br/>30 partitions")]

    NW["notification-worker<br/>0-20 replicas (KEDA)"]

    subgraph CHANNELS["Channel Dispatchers"]
        EMAIL["Email Dispatcher<br/>SMTP relay → SendGrid/SES"]
        SMS["SMS Dispatcher<br/>Twilio API"]
        WS["WebSocket Dispatcher<br/>→ Centrifugo"]
    end

    DLQ[("Dead Letter Topic<br/>notifications.dlq.v1")]

    SRC1 & SRC2 & SRC3 & SRC4 --> KAFKA --> NW
    NW --> EMAIL & SMS & WS
    NW -- "max retries<br/>exceeded" --> DLQ

    classDef src fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef kafka fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef worker fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef chan fill:#dcfce7,color:#14532d,stroke:#16a34a
    classDef dlq fill:#fee2e2,color:#7f1d1d,stroke:#dc2626

    class SRC1,SRC2,SRC3,SRC4 src
    class KAFKA kafka
    class NW worker
    class EMAIL,SMS,WS chan
    class DLQ dlq
```

### 6.1 Notification Message Schema

```json
{
  "schema_version": "1.0",
  "notification_id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "type": "RISK_ALERT",
  "channels": ["EMAIL", "SMS", "IN_APP"],
  "tier_required": "PROFESSIONAL",
  "subject": "Critical: 3 learners need immediate attention",
  "body_text": "...",
  "body_html": "...",
  "metadata": {
    "intervention_id": "uuid",
    "risk_level": "CRITICAL"
  },
  "retry_count": 0,
  "max_retries": 5,
  "created_at": "2026-10-15T14:32:00Z"
}
```

### 6.2 Tier-Based Channel Filtering

The notification worker checks the tenant's tier and **drops disallowed channels** before dispatching:

```python
TIER_CHANNELS = {
    "BASIC": {"EMAIL"},
    "PROFESSIONAL": {"EMAIL", "SMS", "IN_APP"},
    "ENTERPRISE": {"EMAIL", "SMS", "IN_APP", "WEBHOOK"},
}

def filter_channels(tenant_tier, requested_channels):
    allowed = TIER_CHANNELS.get(tenant_tier, set())
    return [c for c in requested_channels if c in allowed]
```

---

## 7. Schema Registry & Evolution

All Kafka messages use **Avro schemas** registered in the Schema Registry (Confluent or Apicurio). This prevents producers from publishing breaking changes.

```mermaid
flowchart LR
    PROD["Producer service"]
    SR["Schema Registry"]
    KAFKA[("Kafka")]
    CONS["Consumer service"]

    PROD -- "fetch schema by ID" --> SR
    PROD -- "serialize with schema" --> KAFKA
    CONS -- "fetch schema by ID" --> SR
    KAFKA -- "deserialize" --> CONS

    classDef step fill:#dbeafe,color:#1e3a8a,stroke:#326ce5
    classDef sr fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef k fill:#e0f2fe,color:#075985,stroke:#0284c7

    class PROD,CONS step
    class SR sr
    class KAFKA k
```

### Compatibility Mode

- **BACKWARD compatibility** is enforced — new schemas can only add optional fields. Removing fields requires a new topic version (`training.attendance.v2`).

---

## 8. Stream Processing for Real-Time Analytics

For UC-10 (Effectiveness Tracking) we use **Kafka Streams** (or **Apache Flink**) to compute rolling KPIs:

```mermaid
flowchart LR
    T1[("training.attendance.v1")]
    T2[("training.assessment.v1")]

    KS["Kafka Streams app<br/>'effectiveness-aggregator'<br/>(stateful, RocksDB-backed)"]

    OUT[("analytics.kpis.rolling.v1<br/>1min, 1hr, 1day windows")]

    CH[("ClickHouse")]
    GRAF["Grafana<br/>Live Dashboard"]

    T1 & T2 --> KS --> OUT
    OUT --> CH --> GRAF

    classDef topic fill:#fef3c7,color:#92400e,stroke:#f59e0b
    classDef ks fill:#f3e8ff,color:#581c87,stroke:#9333ea
    classDef store fill:#e0f2fe,color:#075985,stroke:#0284c7
    classDef viz fill:#dcfce7,color:#14532d,stroke:#16a34a

    class T1,T2,OUT topic
    class KS ks
    class CH store
    class GRAF viz
```

---

## 9. Why Kafka Over Vendor-Specific Queue + Event Services

Most cloud vendors offer **two separate services** — one for queues and another for event streaming. Kafka unifies both into a single technology that is portable across clouds.

| Capability | Vendor Queue Service | Vendor Event-Stream Service | Apache Kafka |
|---|---|---|---|
| Queue semantics | ✓ | — | ✓ (consumer group) |
| Topic / pub-sub | ✓ | ✓ | ✓ |
| Ordered delivery | ✓ (per session) | ✓ (per partition) | ✓ (per partition) |
| Exactly-once delivery | ✓ | — | ✓ (transactional API) |
| Message retention | Up to 14 days | Typically up to 7 days (longer with retention add-ons) | Configurable (effectively unlimited) |
| Throughput per partition | Lower | 1 MB/s | 10+ MB/s |
| Schema enforcement | None | None | Schema Registry |
| Stream processing | None | Vendor-specific (e.g., Stream Analytics) | Kafka Streams, Flink |
| Cost at scale (~1B msgs/mo) | ~$1,500 | ~$700 | ~$300 self-hosted; ~$600-900 managed |
| Portability | Vendor-locked | Vendor-locked | Same code runs on any cloud / on-prem |

**Conclusion:** Kafka replaces **both** queue and event-stream services with a single industry-standard technology. The result: lower operational surface, lower cost, and full cloud portability.
