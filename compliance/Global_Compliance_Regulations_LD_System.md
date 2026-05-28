# Global Compliance Regulations
## Corporate L&D Progress, Intervention & Compliance Tracking SaaS

### Document Version: 1.0
### Date: February 2026

---

## 1. Purpose

This document catalogues all major data privacy and HR compliance regulations applicable globally, assesses their relevance to the Corporate L&D SaaS platform, and maps each regulation's requirements against the current system architecture. It also identifies compliance gaps that must be addressed before the platform can operate legally in each jurisdiction.

The platform processes **employee personal data** including:
- Training attendance records
- Assessment scores and competency results
- Learning risk assessments and risk classifications
- Intervention records (remedial training, coaching assignments)
- Employee profiles aggregated across competency dimensions

This data is classified as **personal data** under virtually all regional privacy frameworks and in some jurisdictions (e.g., India DPDP, South Korea PIPA) may qualify as **sensitive personal data**, attracting stricter controls.

---

## 2. Compliance Applicability Overview

The platform's applicability to each regulation is determined by **where the tenant organisation and its employees are located**, not where the SaaS platform is hosted.

| Region | Regulation | Applies to L&D Platform | Applicability Trigger |
|---|---|---|---|
| 🇪🇺 EU / EEA | GDPR | ✅ Yes | Any tenant with EU/EEA-based employees |
| 🇬🇧 United Kingdom | UK GDPR | ✅ Yes | Any tenant with UK-based employees |
| 🇺🇸 United States (Federal) | SOC 2 Type II | ✅ Yes | SaaS provider trust baseline — all tenants |
| 🇺🇸 California | CCPA / CPRA | ✅ Yes | Tenants with California-based employees |
| 🇺🇸 Virginia / Colorado | VCDPA / CPA | ✅ Yes | Tenants with VA/CO-based employees |
| 🇨🇦 Canada (Federal) | PIPEDA / CPPA | ✅ Yes | Tenants with Canadian employees |
| 🇨🇦 Quebec | Law 25 | ✅ Yes | Tenants with Quebec-based employees |
| 🇧🇷 Brazil | LGPD | ✅ Yes | Tenants with Brazilian employees |
| 🇮🇳 India | DPDP Act 2023 | ✅ Yes | Tenants with Indian employees |
| 🇦🇺 Australia | Privacy Act + APPs | ✅ Yes | Tenants with Australian employees |
| 🇳🇿 New Zealand | Privacy Act 2020 | ✅ Yes | Tenants with NZ-based employees |
| 🇸🇬 Singapore | PDPA 2012 | ✅ Yes | Tenants with Singapore-based employees |
| 🇯🇵 Japan | APPI 2022 | ✅ Yes | Tenants with Japanese employees |
| 🇰🇷 South Korea | PIPA | ✅ Yes | Tenants with South Korean employees |
| 🇨🇳 China | PIPL + DSL + CSL | ⚠️ Conditional | Tenants with China-based employees — strict localisation required |
| 🇿🇦 South Africa | POPIA | ✅ Yes | Tenants with South African employees |
| 🇳🇬 Nigeria | NDPR | ✅ Yes | Tenants with Nigerian employees |
| 🇰🇪 Kenya | Data Protection Act 2019 | ✅ Yes | Tenants with Kenyan employees |
| 🇸🇦 Saudi Arabia | PDPL | ✅ Yes | Tenants with Saudi-based employees |
| 🇦🇪 UAE (DIFC) | DIFC DPL 2020 | ⚠️ Conditional | Tenants operating within DIFC free zone |
| 🇺🇸 Education sector | FERPA | ⚠️ Not applicable | Platform targets corporate L&D, not educational institutions |
| 🇺🇸 Health sector | HIPAA | ⚠️ Conditional | Only if health-linked competency data is captured |

---

## 3. Regulation Detail by Region

---

### 3.1 🇪🇺 Europe & United Kingdom — GDPR / UK GDPR

#### Overview
The **General Data Protection Regulation (GDPR)** is the most comprehensive and widely adopted data privacy framework globally. It applies to any organisation that processes personal data of EU/EEA residents, regardless of where the organisation is based. Post-Brexit, the **UK GDPR** mirrors EU GDPR in substance, with the ICO (Information Commissioner's Office) as the UK supervisory authority.

#### Key Requirements

| Requirement | Description |
|---|---|
| Lawful basis for processing | Must establish a lawful basis (consent, legitimate interest, contractual necessity, legal obligation) before processing employee data |
| Data minimisation | Collect only what is strictly necessary for the stated purpose |
| Purpose limitation | Data collected for L&D may not be repurposed without a new lawful basis |
| Right to erasure | Employees may request deletion of their personal data |
| Right of access | Employees may request a copy of all personal data held about them |
| Right to portability | Employees may request data in a machine-readable format |
| Breach notification | Report breaches to the supervisory authority within 72 hours |
| Data Protection Officer (DPO) | Required if large-scale processing of employee data |
| Cross-border transfer restrictions | Data transfers outside EEA require adequacy decision or Standard Contractual Clauses (SCCs) |
| Privacy by design | Data protection must be embedded into system architecture from the start |

#### Applicability to L&D Platform

| Platform Feature | GDPR Consideration |
|---|---|
| Employee learning profiles | Personal data — requires lawful basis (typically legitimate interest or contract) |
| Risk assessments and risk scoring | May constitute automated decision-making under Article 22 — requires human oversight mechanism |
| Competency gap analysis | Sensitive if linked to disability or health conditions |
| Intervention records | Personal data — must be retained only as long as necessary |
| Audit logs | Must balance retention requirements against data minimisation |
| Multi-tenant architecture | Each tenant (data controller) must sign a Data Processing Agreement (DPA) with the SaaS provider (data processor) |

#### Architecture Gaps

| Gap | Priority |
|---|---|
| No per-employee erasure API | 🔴 High |
| No automated decision-making opt-out or human review mechanism | 🔴 High |
| No Data Processing Agreement (DPA) template for tenants | 🔴 High |
| No consent capture workflow | 🟡 Medium |
| No data residency controls (EU region pinning) | 🟡 Medium |
| No data portability export API per employee | 🟡 Medium |

---

### 3.2 🇺🇸 United States

#### 3.2.1 SOC 2 Type II

SOC 2 Type II is not a law but a **voluntary industry audit standard** for SaaS providers, audited by an independent CPA firm against five Trust Service Criteria:

| Trust Criteria | Description | Platform Relevance |
|---|---|---|
| Security | Protection against unauthorised access | WAF, mTLS, JWT, MFA, HashiCorp Vault |
| Availability | System uptime and performance | SLA commitments, Kubernetes scaling |
| Confidentiality | Protection of sensitive information | AES-256, TLS 1.3, tenant isolation |
| Processing Integrity | Complete and accurate processing | Kafka DLQ, event idempotency, checksums |
| Privacy | Personal information handling | Audit Service, tenant-scoped data |

**Applicability:** Required by most enterprise customers as a procurement prerequisite. The platform should target SOC 2 Type II certification before enterprise sales.

#### 3.2.2 CCPA / CPRA (California)

The **California Consumer Privacy Act (CCPA)**, strengthened by the **California Privacy Rights Act (CPRA)** from 2023, extends privacy rights to **employees** of California-based organisations.

| Requirement | Description |
|---|---|
| Right to know | Employees may request what data is collected and how it is used |
| Right to delete | Employees may request deletion of their personal data |
| Right to correct | Employees may request correction of inaccurate data |
| Right to opt-out of profiling | Employees may opt out of automated risk profiling |
| No retaliation | Employees cannot be penalised for exercising privacy rights |

**Applicability:** The risk scoring and at-risk classification features constitute **automated profiling** under CPRA — opt-out mechanisms and human review processes are mandatory for California tenants.

#### 3.2.3 Virginia (VCDPA) and Colorado (CPA)

Both acts mirror CCPA in substance — data subject rights (access, deletion, correction, portability, opt-out of profiling) apply to employees in those states.

---

### 3.3 🇨🇦 Canada — PIPEDA / Law 25

#### PIPEDA (Federal)
The **Personal Information Protection and Electronic Documents Act** governs private-sector data handling across Canada. The forthcoming **Consumer Privacy Protection Act (CPPA / Bill C-27)** will replace PIPEDA with stronger consent requirements and automated decision-making transparency obligations.

| Requirement | Description |
|---|---|
| Consent | Meaningful consent required for collection, use, or disclosure |
| Purpose limitation | Data used only for stated purposes |
| Individual access | Employees may access their personal data |
| Breach notification | Report breaches to the OPC and affected individuals |
| Accountability | Designate a Privacy Officer |

#### Quebec Law 25
Quebec's Law 25 is the strictest provincial framework — effectively GDPR-equivalent:

| Requirement | Description |
|---|---|
| Privacy Impact Assessment (PIA) | Mandatory before any new personal information system goes live |
| Data residency | Personal data must remain in Quebec or equivalent jurisdictions unless adequately protected |
| Breach notification | 72-hour notification to Commission d'accès à l'information (CAI) |
| Right to data portability | Employees can request data in a technology-neutral format |
| Automated decision-making | Employees must be informed and can request human review |

**Applicability:** Quebec Law 25 is directly triggered for any tenant with Quebec-based employees. PIA documentation is required prior to onboarding such tenants.

---

### 3.4 🇧🇷 Brazil — LGPD

The **Lei Geral de Proteção de Dados (LGPD)** is Brazil's GDPR-equivalent, enforced by the **ANPD** (Autoridade Nacional de Proteção de Dados).

| Requirement | Description |
|---|---|
| Lawful basis | 10 legal bases available — legitimate interest most applicable for employee L&D data |
| Data subject rights | Access, correction, anonymisation, deletion, portability, opt-out |
| DPO appointment | Required for large-scale personal data processing |
| Breach notification | Notify ANPD and data subjects of significant breaches |
| Cross-border transfers | Permitted only to countries with adequate protection or via standard clauses |
| Security measures | Technical and administrative measures proportional to risk |

**Applicability:** Directly applies to any tenant with Brazilian employees. Risk scoring constitutes automated data processing requiring disclosure and opt-out under LGPD.

---

### 3.5 🇮🇳 India — DPDP Act 2023

The **Digital Personal Data Protection Act 2023** is India's new comprehensive privacy law, replacing the earlier IT Act/SPDI Rules framework.

| Requirement | Description |
|---|---|
| Consent-based processing | Express consent required unless processing falls under a specified legitimate use |
| Data fiduciary obligations | Organisations processing data are Data Fiduciaries — must ensure accuracy, security, and data minimisation |
| Significant data fiduciary | Large-scale processors designated by government face additional obligations (DPIA, audits) |
| Data localisation | Certain categories of personal data must be stored within India |
| Right to erasure and correction | Data principals can request correction or deletion |
| Breach notification | Notify DPBI (Data Protection Board of India) and affected individuals |
| Children's data | Strict restrictions — not applicable to this platform |

**Applicability:** Indian employee data must be processed with explicit consent. Data localisation requirements may mandate India-region cloud deployments (e.g., AWS ap-south-1) for tenants with large Indian employee populations.

---

### 3.6 🇦🇺 Australia — Privacy Act 1988 + APPs

The **Australian Privacy Principles (APPs)** under the Privacy Act 1988 set out 13 principles governing the handling of personal information.

| Key Principle | Description |
|---|---|
| APP 1 — Open and transparent management | Maintain a clear privacy policy |
| APP 3 — Collection of solicited information | Collect only what is reasonably necessary |
| APP 6 — Use and disclosure | Use data only for the primary purpose of collection |
| APP 11 — Security | Protect data from misuse, interference, loss, and unauthorised access |
| APP 12 — Access | Employees may access their personal data |
| APP 13 — Correction | Employees may request correction of inaccurate data |
| NDB — Breach notification | Notify OAIC and affected individuals of eligible data breaches |

**Applicability:** Applies to the platform for any tenant with Australian employees. Cross-border data transfers must ensure equivalent protection — cloud region selection (ap-southeast-2 / Sydney) is recommended.

---

### 3.7 🇸🇬 Singapore — PDPA 2012

The **Personal Data Protection Act (PDPA)** governs personal data collection, use, and disclosure in Singapore, administered by the **PDPC** (Personal Data Protection Commission).

| Requirement | Description |
|---|---|
| Consent obligation | Obtain consent before collecting, using, or disclosing personal data |
| Purpose limitation | Use data only for purposes notified to the individual |
| Access and correction | Employees may access and correct their personal data |
| Retention limitation | Retain data only as long as necessary for the purpose |
| Data breach notification | Notify PDPC within 3 days for significant breaches |
| Data portability obligation | Employees may request data portability to another organisation |

**Applicability:** Applies to tenants with Singapore-based employees. The data portability obligation (unique to Singapore's 2021 amendment) requires the platform to support structured data export per employee.

---

### 3.8 🇯🇵 Japan — APPI 2022

The **Act on the Protection of Personal Information (APPI)**, significantly revised in 2022, aligns Japan more closely with GDPR.

| Requirement | Description |
|---|---|
| Third-party transfer restrictions | Strict rules on sharing data with third parties — requires opt-in consent or exemptions |
| Pseudonymisation | Encourages pseudonymisation for analytics use cases |
| Breach notification | Notify PPC (Personal Information Protection Commission) and affected individuals |
| Right to request disclosure | Employees may request access to their retained personal data |
| Cross-border transfers | Requires either consent or confirmation of equivalent protection standards |

**Applicability:** Applies to tenants with Japanese employees. Pseudonymising employee data in analytics and reporting aggregates is recommended.

---

### 3.9 🇰🇷 South Korea — PIPA

South Korea's **Personal Information Protection Act (PIPA)** is among the strictest in Asia.

| Requirement | Description |
|---|---|
| Consent for all processing | Explicit consent required for virtually all personal data processing |
| Mandatory CISO | Chief Information Security Officer designation is legally required |
| Data retention limits | Data must be destroyed when no longer needed |
| Cross-border transfer | Requires individual consent or exemption — very restrictive |
| Breach notification | Notify PIPC and affected individuals within 72 hours |
| Sensitive information | Additional consent required for sensitive data (health, biometrics, etc.) |

**Applicability:** For tenants with South Korean employees, explicit per-employee consent for L&D data processing is likely required. Cross-border data transfer restrictions may require in-country (ap-northeast-2 / Seoul) deployment.

---

### 3.10 🇨🇳 China — PIPL / DSL / CSL

China's data framework consists of three interlocking laws:

| Law | Focus | Key Requirement |
|---|---|---|
| **PIPL** (Personal Information Protection Law) | Personal data | GDPR-equivalent rights, cross-border transfer requires CAC approval or standard contracts |
| **DSL** (Data Security Law) | Data classification | Data classified by national importance — important data requires security assessment for cross-border transfer |
| **CSL** (Cybersecurity Law) | Network and system security | Critical information infrastructure operators must store data within China |

**Applicability:** The most restrictive framework globally. For tenants with China-based employees, the platform likely requires a **fully China-localised deployment** (Alibaba Cloud / Tencent Cloud in mainland China), separate from the global SaaS infrastructure. Cross-border transfer of Chinese employee data without CAC approval is prohibited.

---

### 3.11 🇿🇦 South Africa — POPIA

The **Protection of Personal Information Act (POPIA)** came into full effect in 2021 and is enforced by the **Information Regulator of South Africa**.

| Requirement | Description |
|---|---|
| Lawfulness of processing | 8 conditions for lawful processing — similar to GDPR principles |
| Information Officer | Designated officer must be registered with the Information Regulator |
| Data subject rights | Access, correction, deletion, objection to processing |
| Security safeguards | Appropriate technical and organisational measures |
| Breach notification | Notify Information Regulator and data subjects as soon as reasonably possible |
| Cross-border transfers | Transfers permitted only to countries with equivalent protection |

**Applicability:** Applies to any tenant with South African employees. An Information Officer must be designated for the SaaS provider to be compliant.

---

### 3.12 🇸🇦 Saudi Arabia — PDPL

The **Personal Data Protection Law (PDPL)**, enforced by **SDAIA** (Saudi Data and Artificial Intelligence Authority), came into effect in 2021.

| Requirement | Description |
|---|---|
| Consent | Explicit consent for processing personal data unless legally exempted |
| Data localisation | Sensitive personal data must be stored within Saudi Arabia |
| Cross-border transfers | Requires SDAIA approval for cross-border data transfers |
| Data subject rights | Access, correction, deletion, and objection |
| Breach notification | Notify SDAIA within 72 hours |
| Sensitive data | Health, financial, and biometric data treated with heightened controls |

**Applicability:** Saudi tenants require data residency in Saudi Arabia (AWS me-south-1 / Bahrain or dedicated Saudi deployment). Risk assessment scores may be treated as sensitive personal data under PDPL.

---

## 4. Regulations NOT Applicable to This Platform

| Regulation | Reason Not Applicable |
|---|---|
| **FERPA** | Applies to educational institutions (schools, universities). This platform targets corporate organisations — FERPA does not apply. |
| **HIPAA** | Applies only if health-related personal data (medical records, disability information) is processed. The platform does not capture health data by design — applicable only if a tenant chooses to link health accommodations to competency plans. |
| **ITAR / EAR** | Applies to defence and aerospace sector data exports. Relevant only if the platform is deployed for defence-sector tenants with classified competency programmes. |

---

## 5. Compliance Requirements Mapping to Platform Architecture

### 5.1 What the Current Architecture Already Covers

| Compliance Control | Regulations Satisfied | Architecture Feature |
|---|---|---|
| Encryption at rest (AES-256) | GDPR, LGPD, DPDP, POPIA, PDPA, PDPL, SOC 2 | Stated in security architecture |
| Encryption in transit (TLS 1.3) | All regulations | Edge layer + mTLS service mesh |
| Role-based access control (RBAC) | All regulations | Role permissions matrix |
| Immutable audit trail | GDPR, SOC 2, LGPD, POPIA, CCPA, PIPEDA | Audit Service consuming all Kafka events |
| Multi-tenant data isolation | All regulations | Schema-per-tenant / row-level tenant_id isolation |
| Tenant data purge on deprovisioning | GDPR (right to erasure), LGPD, CCPA | `tenant.deprovisioned` event → 90-day purge |
| Breach detection logging | All regulations | Audit Service + DLQ alerting |
| MFA and SSO | SOC 2, GDPR, PIPA, PDPA | Auth Service — OAuth2, SAML, MFA |
| Secret management | SOC 2 | HashiCorp Vault |

### 5.2 Architecture Gaps by Compliance Requirement

| Gap | Regulations Requiring It | Priority | Recommended Fix |
|---|---|---|---|
| No per-employee data erasure API | GDPR, LGPD, CCPA, PDPA, POPIA, DPDP, APPI | 🔴 Critical | Add `DELETE /employees/{id}/personal-data` endpoint across all domain services |
| No per-employee data export API (portability) | GDPR, CCPA, PDPA, PIPEDA, Law 25 | 🔴 Critical | Add `GET /employees/{id}/data-export` returning structured JSON / CSV |
| No automated decision-making disclosure or opt-out | GDPR Art.22, CCPA/CPRA, LGPD, DPDP, Law 25 | 🔴 Critical | Add human review step in risk escalation workflow; expose opt-out flag per employee |
| No consent capture and management | DPDP, PIPA, PIPL, PDPL, PIPEDA | 🔴 Critical | Add consent service or consent fields in Employee Profile Service |
| No data residency / region pinning per tenant | DPDP, PIPL, PDPL, PIPA, Law 25 | 🔴 Critical | Add `data_region` field to tenant configuration; enforce cloud region selection at provisioning |
| No breach notification workflow | All regulations | 🟡 High | Add breach detection alerts and automated notification pipeline to DPA/regulator contacts |
| No Data Processing Agreement (DPA) generation | GDPR, LGPD, PDPA | 🟡 High | Operational process — generate DPA template per tenant at onboarding |
| No Privacy Impact Assessment (PIA) process | GDPR, Law 25, DPDP | 🟡 High | Document PIA template; require completion before onboarding high-risk tenants |
| No data retention schedule per jurisdiction | GDPR, APPI, PDPA, PIPA, CCPA | 🟡 High | Add `retention_policy` configuration per tenant linked to jurisdiction |
| No pseudonymisation in reporting aggregates | APPI, GDPR | 🟠 Medium | Anonymise employee identifiers in L&D aggregate reports |
| No Information Officer / DPO designation process | POPIA, LGPD, GDPR | 🟠 Medium | Operational process — document role assignment per tenant |
| No China-localised deployment option | PIPL, DSL, CSL | 🟠 Medium | Architecture decision — evaluate dedicated China deployment topology |

---

## 6. Recommended Compliance Implementation Roadmap

### Phase 1 — Immediate (Pre-Launch Blockers)
- [ ] Implement per-employee data erasure API across all domain services
- [ ] Implement per-employee data export (portability) API
- [ ] Add human review gate to CRITICAL risk escalation workflow (GDPR Art.22)
- [ ] Draft and publish Data Processing Agreement (DPA) template for all tenants
- [ ] Add `data_region` field to Tenant Management Service and enforce at provisioning

### Phase 2 — Short Term (Within 3 Months of Launch)
- [ ] Build consent capture and audit module within Employee Profile Service
- [ ] Implement automated breach notification pipeline (Audit Service → regulator notification)
- [ ] Define and enforce per-jurisdiction data retention schedules
- [ ] Complete Privacy Impact Assessment (PIA) documentation template
- [ ] Add opt-out flag for automated risk profiling per employee

### Phase 3 — Medium Term (3–6 Months)
- [ ] Pseudonymise employee identifiers in all reporting aggregates
- [ ] Enable per-tenant region pinning for AP, LATAM, MEA cloud regions
- [ ] Obtain SOC 2 Type II certification (audit engagement)
- [ ] Evaluate China-localised deployment topology for PIPL compliance
- [ ] Publish GDPR and LGPD compliance documentation for customer trust portal

### Phase 4 — Ongoing
- [ ] Annual review of all regulations for amendments
- [ ] Quarterly internal data protection audits
- [ ] Maintain Confluent Schema Registry and event versioning for audit trail integrity
- [ ] Update DPA templates as regulations evolve (e.g., India DPDP secondary legislation)

---

## 7. Compliance Priority Matrix for L&D Platform

| Regulation | Risk if Non-Compliant | Implementation Effort | Priority |
|---|---|---|---|
| GDPR / UK GDPR | Fines up to €20M or 4% global turnover | High | 🔴 Critical |
| SOC 2 Type II | Loss of enterprise customers | Medium | 🔴 Critical |
| CCPA / CPRA | Fines up to $7,500 per intentional violation | Medium | 🔴 Critical |
| LGPD | Fines up to 2% of Brazil revenue (max R$50M) | Medium | 🔴 Critical |
| DPDP Act 2023 | Fines up to ₹250 crore (~$30M USD) | High | 🔴 Critical |
| PDPA (Singapore) | Fines up to SGD 1M or 10% of annual turnover | Medium | 🟡 High |
| POPIA | Fines up to ZAR 10M or 10 years imprisonment | Medium | 🟡 High |
| PIPEDA / Law 25 | Fines up to CAD 25M (Law 25) | Medium | 🟡 High |
| APPI (Japan) | Fines up to ¥100M | Medium | 🟡 High |
| PIPA (South Korea) | Fines up to 3% of global revenue | High | 🟡 High |
| PDPL (Saudi Arabia) | Fines up to SAR 5M | High | 🟠 Medium |
| PIPL (China) | Fines up to ¥50M or 5% of annual revenue | Very High | 🟠 Medium |
| VCDPA / CPA | Fines up to $7,500 per violation | Low | 🟠 Medium |
| NDPR (Nigeria) | Fines up to 2% of annual gross revenue | Low | 🟡 Low |

---

## 8. Glossary

| Term | Definition |
|---|---|
| **Data Controller** | The organisation (tenant) that determines why and how personal data is processed |
| **Data Processor** | The SaaS provider — processes data on behalf of the controller |
| **Data Subject** | The employee whose personal data is being processed |
| **DPA** | Data Processing Agreement — contract between controller and processor |
| **DPO** | Data Protection Officer — designated privacy role required under GDPR and LGPD |
| **PIA / DPIA** | Privacy / Data Protection Impact Assessment — risk analysis before new processing activities |
| **Lawful basis** | Legal justification for processing personal data under GDPR and equivalent laws |
| **Data residency** | Requirement that personal data physically remain within a specific geographic boundary |
| **Pseudonymisation** | Processing data so it cannot be attributed to a specific individual without additional information |
| **Automated decision-making** | Decisions made solely by algorithms without human involvement — regulated under GDPR Art.22 |

---

*Document generated from architecture review of the Corporate L&D SaaS platform. Cross-references: `01-architecture.md`, `Microservice_Communication_Architecture.md`, `SaaS_Event_Contracts.md`, `Corporate-Learning-System-Problem-Statement-3.txt`.*
