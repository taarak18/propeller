/**
 * PS3_Azure_Architecture_Diagram.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Corporate Learning SaaS Platform — Azure Cloud Architecture
 * Extracted from: PS3_Azure_System_Design.html
 *
 * USAGE OPTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 * Option A — Render via Mermaid CLI (recommended):
 *   npm install -g @mermaid-js/mermaid-cli
 *   mmdc -i PS3_Azure_Architecture_Diagram.mjs -o diagram.svg
 *   mmdc -i PS3_Azure_Architecture_Diagram.mjs -o diagram.png -w 2400
 *   mmdc -i PS3_Azure_Architecture_Diagram.mjs -o diagram.pdf
 *
 * Option B — Node.js (print source to stdout):
 *   node PS3_Azure_Architecture_Diagram.mjs
 *   node PS3_Azure_Architecture_Diagram.mjs --json   (print JSON metadata)
 *   node PS3_Azure_Architecture_Diagram.mjs --mmd    (print raw .mmd source)
 *
 * Option C — Paste diagram source online:
 *   https://mermaid.live  → paste the diagramSource string below
 *
 * Option D — VS Code:
 *   Install "Markdown Preview Mermaid Support" or "Mermaid Chart" extension
 *   Paste diagram source in a .md code block: ```mermaid ... ```
 *
 * Option E — Import in another module:
 *   import { diagramSource, diagramMeta, mermaidConfig } from './PS3_Azure_Architecture_Diagram.mjs';
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Mermaid initialisation configuration ──────────────────────────────────────
export const mermaidConfig = {
  theme: 'default',
  flowchart: {
    curve: 'orthogonal',
    useMaxWidth: true
  },
  themeVariables: {
    primaryColor:       '#deecf9',
    primaryTextColor:   '#004578',
    primaryBorderColor: '#0078d4',
    lineColor:          '#0078d4',
    secondaryColor:     '#dff6dd',
    tertiaryColor:      '#f4e9ff'
  }
};

// ── Mermaid diagram source (107 lines, flowchart TD) ─────────────────────────
export const diagramSource = `%%{init: ${JSON.stringify(mermaidConfig)}}%%
flowchart TD
    subgraph CLIENTS["🖥️ Client Layer"]
        B["React PWA\\n(Browser)"]
        M["Android PWA\\n(Mobile)"]
        ES["External Systems\\nLMS / Attendance / Assessment APIs"]
    end

    subgraph EDGE["🌐 Global Edge Layer"]
        AFD["☁️ Azure Front Door\\nCDN · WAF · DDoS · SSL Termination"]
        SWA["📦 Azure Static Web Apps\\nReact SPA / PWA"]
    end

    subgraph GATEWAY["🔀 API Gateway"]
        APIM["⚙️ Azure API Management\\nRate Limiting · JWT Validation\\nTenant Routing · API Keys"]
    end

    subgraph APP["☁️ Application Layer — Azure Container Apps"]
        TS["🏢 Tenant Service\\nUC-01 · UC-02 · UC-03"]
        IS["🔐 Identity Service\\nUC-04 SSO / SAML / OIDC"]
        IG["📥 Ingestion Service\\nUC-05 Data Ingest"]
        PS["👤 Profile Service\\nUC-06 Aggregation"]
        RS["⚙️ Risk Rules Service\\nUC-07 Rule Config"]
        RE["🚨 Risk Engine\\nUC-08 Batch Evaluation"]
        IV["🛠️ Intervention Service\\nUC-09 · UC-10"]
        RP["📋 Report Service\\nUC-11 PDF / Excel / CSV"]
        DS["📊 Dashboard Service\\nUC-12 Role Dashboards"]
        NS["🔔 Notification Service\\nEmail · SMS · In-App"]
        AS["📝 Audit Service\\nAudit Trail"]
        BS["💰 Billing Service\\nSubscription Mgmt"]
    end

    subgraph BATCH["⏱️ Batch and Event Layer"]
        AF["⚡ Azure Functions\\nNightly Risk Batch\\nScheduled Reports"]
        SB["📨 Azure Service Bus\\nApproval Queues\\nNotification Queue"]
        EH["📡 Azure Event Hubs\\nData Ingestion Stream\\n1M+ events per day"]
    end

    subgraph DATA["🗄️ Data Layer"]
        PG["🐘 Azure DB for PostgreSQL\\nFlexible Server · RLS · HA"]
        RD["⚡ Azure Cache for Redis\\nSession · Dashboard · Rate Limit"]
        BLOB["📁 Azure Blob Storage\\nReports · Imports · Templates"]
        COSMOS["🌍 Azure Cosmos DB\\nAudit Trail · Append-Only"]
    end

    subgraph IDENTITY["🔒 Identity and Security"]
        B2C["🆔 Azure AD B2C\\nMulti-Tenant SSO\\nSAML 2.0 / OIDC"]
        KV["🔑 Azure Key Vault\\nSecrets · API Keys · Certs"]
        PE["🔗 Private Endpoints\\nAll Data Services on VNet"]
    end

    subgraph OBS["📊 Observability"]
        AI["🔍 Application Insights\\nDistributed Tracing"]
        LA["📋 Log Analytics\\nCentralised Logs"]
        MON["🚨 Azure Monitor\\nAlerts · Dashboards"]
    end

    subgraph DEVOPS["🔄 DevOps"]
        ADO["🔄 Azure DevOps\\nCI/CD Pipelines"]
        ACR["📦 Azure Container Registry\\nDocker Images"]
    end

    B & M --> AFD
    ES --> APIM
    AFD --> SWA
    AFD --> APIM
    APIM --> TS & IS & IG & PS & RS & IV & RP & DS & AS & BS
    IG --> EH
    RE --> SB
    IV --> SB
    RP --> SB
    SB --> NS
    SB --> AF
    TS & IS & IG & PS & RS & RE & IV & RP & DS & AS & BS --> PG
    PS & DS & RS --> RD
    RP --> BLOB
    AS --> COSMOS
    AF --> PG
    AF --> BLOB
    EH --> PS
    IS --> B2C
    KV -.-> TS & IS & IG & PS & RS & IV & RP & DS & AS & BS
    DATA --> PE
    APP --> AI
    AI --> LA
    LA --> MON
    ADO --> ACR
    ACR --> APP

    classDef clientStyle   fill:#1e293b,color:#94a3b8,stroke:#475569
    classDef edgeStyle     fill:#dbeafe,color:#1e40af,stroke:#3b82f6
    classDef gatewayStyle  fill:#fef9c3,color:#713f12,stroke:#eab308
    classDef appStyle      fill:#dcfce7,color:#14532d,stroke:#22c55e
    classDef batchStyle    fill:#f3e8ff,color:#4a1d96,stroke:#a855f7
    classDef dataStyle     fill:#e0f2fe,color:#0c4a6e,stroke:#0284c7
    classDef identityStyle fill:#ffe4e6,color:#881337,stroke:#f43f5e
    classDef obsStyle      fill:#d1fae5,color:#064e3b,stroke:#10b981
    classDef devopsStyle   fill:#f1f5f9,color:#1e293b,stroke:#94a3b8

    class B,M,ES clientStyle
    class AFD,SWA edgeStyle
    class APIM gatewayStyle
    class TS,IS,IG,PS,RS,RE,IV,RP,DS,NS,AS,BS appStyle
    class AF,SB,EH batchStyle
    class PG,RD,BLOB,COSMOS dataStyle
    class B2C,KV,PE identityStyle
    class AI,LA,MON obsStyle
    class ADO,ACR devopsStyle`;

// ── Diagram metadata ──────────────────────────────────────────────────────────
export const diagramMeta = {
  title:         'PS3 — Azure Cloud Architecture · Corporate Learning SaaS Platform',
  diagramType:   'flowchart TD',
  totalLines:    107,
  sourceFile:    'PS3_Azure_System_Design.html',
  extractedAt:   new Date().toISOString(),

  layers: [
    { id: 'CLIENTS',  label: 'Client Layer',              nodeCount: 3  },
    { id: 'EDGE',     label: 'Global Edge Layer',          nodeCount: 2  },
    { id: 'GATEWAY',  label: 'API Gateway',                nodeCount: 1  },
    { id: 'APP',      label: 'Application Layer',          nodeCount: 12 },
    { id: 'BATCH',    label: 'Batch and Event Layer',      nodeCount: 3  },
    { id: 'DATA',     label: 'Data Layer',                 nodeCount: 4  },
    { id: 'IDENTITY', label: 'Identity and Security',      nodeCount: 3  },
    { id: 'OBS',      label: 'Observability',              nodeCount: 3  },
    { id: 'DEVOPS',   label: 'DevOps',                     nodeCount: 2  }
  ],

  azureServices: [
    'Azure Front Door',
    'Azure Static Web Apps',
    'Azure API Management',
    'Azure Container Apps',
    'Azure Functions',
    'Azure Service Bus',
    'Azure Event Hubs',
    'Azure DB for PostgreSQL Flexible Server',
    'Azure Cache for Redis',
    'Azure Blob Storage',
    'Azure Cosmos DB',
    'Azure AD B2C',
    'Azure Key Vault',
    'Private Endpoints (VNet)',
    'Application Insights',
    'Azure Log Analytics',
    'Azure Monitor',
    'Azure DevOps',
    'Azure Container Registry'
  ],

  microservices: [
    { id: 'TS',  name: 'Tenant Service',       useCases: ['UC-01', 'UC-02', 'UC-03'] },
    { id: 'IS',  name: 'Identity Service',      useCases: ['UC-04'] },
    { id: 'IG',  name: 'Ingestion Service',     useCases: ['UC-05'] },
    { id: 'PS',  name: 'Profile Service',       useCases: ['UC-06'] },
    { id: 'RS',  name: 'Risk Rules Service',    useCases: ['UC-07'] },
    { id: 'RE',  name: 'Risk Engine',           useCases: ['UC-08'] },
    { id: 'IV',  name: 'Intervention Service',  useCases: ['UC-09', 'UC-10'] },
    { id: 'RP',  name: 'Report Service',        useCases: ['UC-11'] },
    { id: 'DS',  name: 'Dashboard Service',     useCases: ['UC-12'] },
    { id: 'NS',  name: 'Notification Service',  useCases: [] },
    { id: 'AS',  name: 'Audit Service',         useCases: [] },
    { id: 'BS',  name: 'Billing Service',       useCases: [] }
  ],

  useCases: [
    'UC-01 Tenant Onboarding',
    'UC-02 Tenant Management',
    'UC-03 Subscription Tier',
    'UC-04 SSO Configuration',
    'UC-05 Data Ingestion',
    'UC-06 Profile Aggregation',
    'UC-07 Rule Configuration',
    'UC-08 Risk Evaluation (Batch)',
    'UC-09 Assign Intervention',
    'UC-10 Track Effectiveness',
    'UC-11 Compliance Report',
    'UC-12 Role-Based Dashboards'
  ]
};

// ── Node.js CLI entry point ───────────────────────────────────────────────────
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').includes('PS3_Azure_Architecture_Diagram')
) {
  const args = process.argv.slice(2);

  if (args.includes('--json')) {
    // Print structured metadata as JSON
    console.log(JSON.stringify({ config: mermaidConfig, meta: diagramMeta }, null, 2));

  } else if (args.includes('--mmd')) {
    // Print raw .mmd source only (pipe-friendly)
    console.log(diagramSource);

  } else {
    // Default: print human-readable summary + usage
    const sep = '─'.repeat(64);
    console.log('\n' + sep);
    console.log(' PS3 — Azure Architecture Diagram | Mermaid Script');
    console.log(sep);
    console.log(` Title        : ${diagramMeta.title}`);
    console.log(` Diagram Type : ${diagramMeta.diagramType}`);
    console.log(` Source Lines : ${diagramMeta.totalLines}`);
    console.log(` Source File  : ${diagramMeta.sourceFile}`);
    console.log(` Extracted    : ${diagramMeta.extractedAt}`);
    console.log(sep);
    console.log(` Architecture Layers : ${diagramMeta.layers.length}`);
    diagramMeta.layers.forEach(l =>
      console.log(`   • ${l.label.padEnd(28)} (${l.nodeCount} nodes)`)
    );
    console.log(sep);
    console.log(` Azure Services : ${diagramMeta.azureServices.length}`);
    diagramMeta.azureServices.forEach(s => console.log(`   • ${s}`));
    console.log(sep);
    console.log(` Microservices  : ${diagramMeta.microservices.length}`);
    diagramMeta.microservices.forEach(s =>
      console.log(`   • ${s.name.padEnd(26)} ${s.useCases.join(', ')}`)
    );
    console.log(sep);
    console.log('\n USAGE:');
    console.log('   node PS3_Azure_Architecture_Diagram.mjs             → this summary');
    console.log('   node PS3_Azure_Architecture_Diagram.mjs --mmd       → print .mmd source');
    console.log('   node PS3_Azure_Architecture_Diagram.mjs --json      → print JSON metadata');
    console.log('   mmdc -i PS3_Azure_Architecture_Diagram.mjs -o out.svg   → render SVG');
    console.log('   mmdc -i PS3_Azure_Architecture_Diagram.mjs -o out.png -w 2400 → render PNG');
    console.log('   https://mermaid.live  → paste diagramSource for online preview\n');
  }
}
