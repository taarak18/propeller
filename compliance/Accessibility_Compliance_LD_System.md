# Accessibility Compliance
## Corporate L&D Progress, Intervention & Compliance Tracking SaaS

### Document Version: 1.0
### Date: February 2026

---

## 1. Purpose

This document defines the accessibility compliance obligations for the Corporate L&D SaaS platform, covering all applicable EU and global accessibility regulations, technical standards, and success criteria. It maps each requirement to the platform's features, identifies current architecture gaps, and provides a prioritised implementation roadmap.

The platform serves the following user groups, all of whom may include users with disabilities:
- **Employees** — accessing learning dashboards, progress views, and intervention notifications
- **Trainers** — managing intervention sessions, logging attendance, reviewing at-risk learners
- **L&D Administrators** — authoring competency rules, generating compliance reports, managing users
- **L&D Managers** — approving interventions, reviewing dashboards, monitoring team risk profiles

Accessibility compliance is not optional — the **European Accessibility Act (EAA) enforcement deadline of 28 June 2025 has already passed**. Non-compliant digital services sold in the EU are now legally exposed across all 27 member states.

---

## 2. Applicable Regulations and Standards

### 2.1 Applicability Summary

| Regulation / Standard | Applies To L&D Platform | Trigger | Status |
|---|---|---|---|
| **EAA — EU Directive 2019/882** | ✅ Yes | Digital service sold in EU market | 🔴 Enforcement active since 28 June 2025 |
| **EN 301 549 v3.2.1** | ✅ Yes | Technical standard mandated by EAA | 🔴 Active |
| **WCAG 2.1 Level A** | ✅ Yes | Minimum baseline embedded in EN 301 549 | 🔴 Active |
| **WCAG 2.1 Level AA** | ✅ Yes | Required by EAA via EN 301 549 Clause 9 | 🔴 Active |
| **WCAG 2.2 Level AA** | ⚠️ Best Practice | EN 301 549 not yet updated — recommended to adopt now | 🟡 No hard deadline yet |
| **WAD — EU Directive 2016/2102** | ⚠️ Conditional | Only for public sector tenant organisations | 🔴 Active |
| **UK Equality Act 2010** | ⚠️ Conditional | Tenants with UK-based employees | 🔴 Active |
| **PSBAR 2018 (UK)** | ⚠️ Conditional | Public sector UK tenants only | 🔴 Active |
| **Section 508 (US)** | ⚠️ Conditional | US federal government tenants only | 🔴 Active |
| **ADA (US)** | ⚠️ Conditional | US-based tenants — courts increasingly apply to digital services | 🟡 Case-law dependent |
| **WCAG 3.0** | ❌ Not yet applicable | Still in draft — no jurisdiction mandates it yet | 🟢 Monitor only |

---

### 2.2 European Accessibility Act (EAA)

| Attribute | Detail |
|---|---|
| **Directive** | EU Directive 2019/882 |
| **Enforcement Date** | 28 June 2025 |
| **Scope** | All private sector companies offering products and services in the EU |
| **Technical Standard Referenced** | EN 301 549 v3.2.1 incorporating WCAG 2.1 AA |
| **Key Obligations** | Accessible UI, accessibility statement, user feedback mechanism |
| **Penalties** | Varies by member state — Germany up to €100,000, France up to €25,000 per violation |
| **Member State Transpositions** | Germany: BFSG, France: Loi Accessibilité, Spain: RD 1112/2018 extended, Italy: Legge Stanca extended |

#### EAA Core Requirements for the L&D Platform

| Requirement | Description | Platform Impact |
|---|---|---|
| Perceivable | All content must be presentable to users in ways they can perceive — text alternatives, captions, adaptable layouts | Learning dashboards, risk reports, charts, training content |
| Operable | All functionality must be operable via keyboard and assistive technologies | Admin UI, learner portal, intervention approval workflows |
| Understandable | UI must be readable, predictable, and provide input assistance | Forms, rule authoring, report generation |
| Robust | Content must be interpreted reliably by assistive technologies | Semantic HTML, ARIA, standards-compliant component library |
| Accessibility Statement | Formal published statement of conformance level and known limitations | Required per product / per tenant portal |
| Feedback Mechanism | Users must be able to report accessibility barriers and receive timely responses | Must be implemented in all user-facing portals |

---

### 2.3 EN 301 549 v3.2.1 — Clause-by-Clause Applicability

| Clause | Title | Applies | L&D Platform Context |
|---|---|---|---|
| **Clause 5** | Generic requirements | ✅ | Applies to all ICT features — closed functionality, biometric support |
| **Clause 6** | ICT with two-way voice | ⚠️ Conditional | Only if live virtual coaching sessions are added to the platform |
| **Clause 7** | ICT with video capabilities | ✅ | All embedded training videos must have captions and audio descriptions |
| **Clause 9** | Web content | ✅ | All web-based learner, trainer, and admin interfaces — WCAG 2.1 AA in full |
| **Clause 10** | Non-web documents | ✅ | All exported compliance reports (PDF, Excel, CSV) must meet document accessibility standards |
| **Clause 11** | Non-web software | ⚠️ Conditional | Applies if a native mobile app is built for the platform |
| **Clause 12** | Documentation and support | ✅ | Help documentation, API docs for integrators, support portal must be accessible |
| **Clause 13** | ICT providing relay or emergency services | ❌ | Not applicable |

---

## 3. WCAG 2.1 Level AA — Full Success Criteria Mapping

### 3.1 Principle 1 — Perceivable

| SC | Level | Requirement | L&D Platform Application |
|---|---|---|---|
| **1.1.1** | A | Non-text content has text alternatives | Icons in dashboards, charts, risk level indicators, profile avatars |
| **1.2.1** | A | Audio-only and video-only content has alternatives | Pre-recorded training video transcripts |
| **1.2.2** | A | Captions for pre-recorded audio in video | All training video content embedded in the platform |
| **1.2.3** | A | Audio description or media alternative for video | Training videos with visual-only information |
| **1.2.4** | AA | Captions for live audio content | Live virtual coaching sessions (if implemented) |
| **1.2.5** | AA | Audio description for pre-recorded video | Training videos where visual context is critical |
| **1.3.1** | A | Info and relationships conveyed through structure | Tables in reports, form labels, heading hierarchy in dashboards |
| **1.3.2** | A | Meaningful sequence preserved | Risk assessment cards, intervention timeline, learning profile sections |
| **1.3.3** | A | No reliance on sensory characteristics alone | Buttons not labelled only by colour or shape (e.g., red = at-risk) |
| **1.3.4** | AA | Content not restricted to single orientation | Mobile view of learner dashboard and reports |
| **1.3.5** | AA | Identify input purpose | Login forms, employee search, report date range pickers |
| **1.4.1** | A | Colour not the only visual means of information | Risk level indicators — CRITICAL, HIGH, MEDIUM, LOW must not rely on colour alone |
| **1.4.2** | A | No auto-playing audio | Platform must not auto-play audio notifications |
| **1.4.3** | AA | Contrast ratio minimum 4.5:1 for text | All text in dashboards, tables, labels, buttons |
| **1.4.4** | AA | Text resizable up to 200% without loss of content | Learner portal, admin UI, report viewer |
| **1.4.5** | AA | Images of text avoided where possible | Report headers, chart labels must use real text |
| **1.4.10** | AA | Reflow — content readable at 320px width without horizontal scroll | All views on mobile at 400% zoom |
| **1.4.11** | AA | Non-text contrast minimum 3:1 | Form input borders, focus rings, chart lines |
| **1.4.12** | AA | Text spacing adjustable without loss of content | Learner profile pages, intervention details |
| **1.4.13** | AA | Content on hover or focus is dismissable, hoverable, persistent | Tooltips on risk score breakdowns, chart hover states |

---

### 3.2 Principle 2 — Operable

| SC | Level | Requirement | L&D Platform Application |
|---|---|---|---|
| **2.1.1** | A | All functionality available via keyboard | Intervention approval, rule authoring, report generation, navigation |
| **2.1.2** | A | No keyboard trap | Modal dialogs (rule editor, report preview, approval dialog) |
| **2.1.4** | A | Character key shortcuts can be turned off or remapped | Any keyboard shortcut in the admin UI |
| **2.2.1** | A | Timing adjustable — sessions must warn before timeout | JWT session expiry must give user a warning and option to extend |
| **2.2.2** | A | Pause, stop, hide for moving content | Any animated charts, live feed notifications, risk score animations |
| **2.3.1** | A | No content flashing more than 3 times per second | Alert notifications, dashboard refresh animations |
| **2.4.1** | A | Bypass blocks — skip navigation links | All pages with repeated navigation headers |
| **2.4.2** | A | Page titles describe topic or purpose | Every view must have a descriptive, unique page title |
| **2.4.3** | A | Focus order — logical and meaningful | Tab order through risk assessment cards, filter controls, action buttons |
| **2.4.4** | A | Link purpose clear from context | Report download links, employee profile links, intervention action links |
| **2.4.5** | AA | Multiple ways to find pages | Breadcrumbs, search, sitemap — across admin and learner portals |
| **2.4.6** | AA | Headings and labels descriptive | Dashboard section headings, form field labels |
| **2.4.7** | AA | Focus visible — keyboard focus indicator visible | All interactive elements — buttons, links, inputs, selects |
| **2.5.1** | A | Pointer gestures — single pointer alternatives | Any swipe or multi-touch interaction in mobile view |
| **2.5.2** | A | Pointer cancellation | Drag-and-drop in rule builder must be cancellable |
| **2.5.3** | A | Label in name — visible label matches accessible name | All buttons and icon-only controls must have matching accessible names |
| **2.5.4** | A | Motion actuation — alternatives to device motion | Any shake-to-refresh or tilt-based interactions |

---

### 3.3 Principle 3 — Understandable

| SC | Level | Requirement | L&D Platform Application |
|---|---|---|---|
| **3.1.1** | A | Language of page set in HTML | All tenant portal pages must declare `lang` attribute |
| **3.1.2** | AA | Language of parts identified | Multi-language content within a page (e.g., mixed-language training content) |
| **3.2.1** | A | No unexpected context change on focus | Dropdowns, date pickers, filter controls must not auto-submit on focus |
| **3.2.2** | A | No unexpected context change on input | Competency rule builder, employee search must not redirect on input |
| **3.2.3** | AA | Consistent navigation across pages | Top navigation, sidebar, breadcrumb placement consistent throughout |
| **3.2.4** | AA | Consistent identification of components | Save buttons, edit icons, risk badge colours consistent across all views |
| **3.3.1** | A | Error identification — clear, specific error messages | Rule authoring validation, report generation errors, login failures |
| **3.3.2** | A | Labels or instructions for required inputs | All form fields in rule editor, report scheduler, user management |
| **3.3.3** | AA | Error suggestion — provide fix guidance where possible | Invalid date range, missing required field, conflicting rule conditions |
| **3.3.4** | AA | Error prevention for legal/financial/data submissions | Report submissions, intervention approvals, rule activations — confirm before submit |

---

### 3.4 Principle 4 — Robust

| SC | Level | Requirement | L&D Platform Application |
|---|---|---|---|
| **4.1.1** | A | Valid, well-formed HTML | All rendered pages must pass HTML validation — no duplicate IDs |
| **4.1.2** | A | Name, role, value for all UI components | Custom components (risk badges, score charts, rule editor) must expose ARIA roles |
| **4.1.3** | AA | Status messages announced by assistive technology | Success/error toasts, loading states, live region updates for risk score changes |

---

## 4. WCAG 2.2 — New Success Criteria (Best Practice — Adopt Now)

WCAG 2.2 was published in October 2023. EN 301 549 is being updated to incorporate it. Implementing now avoids costly retrofitting when it becomes legally mandated.

| SC | Level | Requirement | L&D Platform Application |
|---|---|---|---|
| **2.4.11** | AA | Focus Appearance (Minimum) — focus indicator must meet minimum size and contrast | All interactive components — buttons, links, inputs across all portals |
| **2.4.12** | AAA | Focus Appearance (Enhanced) — stricter focus visibility | Recommended for admin portal — high-use power users |
| **2.4.13** | AAA | Focus Appearance (additional context) | Ensures focus visible against any background |
| **2.5.7** | AA | Dragging Movements — single-pointer alternative required | Rule builder drag-and-drop, dashboard widget reordering |
| **2.5.8** | AA | Target Size (Minimum) — 24x24 CSS pixels minimum | All buttons, checkboxes, radio buttons, action icons in tables |
| **3.2.6** | A | Consistent Help — help link in consistent location | Help icon, support link must appear in same location across all pages |
| **3.3.7** | A | Redundant Entry — do not ask users to re-enter information | Multi-step report wizards, intervention forms, user onboarding flows |
| **3.3.8** | AA | Accessible Authentication (Minimum) — no cognitive test without alternative | Login must not use CAPTCHA without an accessible alternative |
| **3.3.9** | AAA | Accessible Authentication (Enhanced) — no cognitive test at all | Recommended — use passkeys, SSO, or magic links instead of CAPTCHA |

---

## 5. Platform Feature Accessibility Requirements

### 5.1 Learner Dashboard

| Feature | Accessibility Requirement |
|---|---|
| Risk level indicator (CRITICAL / HIGH / MEDIUM / LOW) | Must not rely on colour alone — include text label and icon (SC 1.4.1) |
| Competency score charts and trend graphs | Must have text alternatives or data table equivalents (SC 1.1.1) |
| Progress percentage bars | Must be labelled with accessible name and numeric value (SC 4.1.2) |
| Notification banners | Must be announced as live regions via `aria-live` (SC 4.1.3) |
| Navigation menu | Must include skip-to-content link (SC 2.4.1) |

### 5.2 Risk Assessment View

| Feature | Accessibility Requirement |
|---|---|
| Risk score breakdown table | Full table semantics — `<th>` headers, `scope` attributes (SC 1.3.1) |
| Rules triggered list | Meaningful list structure with ARIA roles (SC 1.3.1) |
| Automated risk classification | Must disclose automated decision-making (GDPR Art.22 + accessibility transparency) |
| Risk escalation alerts | Must be perceivable without colour (SC 1.4.1) and announced via `aria-live` (SC 4.1.3) |

### 5.3 Intervention Management

| Feature | Accessibility Requirement |
|---|---|
| Intervention approval dialog | Must be a true modal with focus trap and focus return on close (SC 2.1.2) |
| Session logging form | Full label/input association, error messages linked via `aria-describedby` (SC 3.3.1, 3.3.2) |
| Intervention timeline | Semantic ordered list or timeline component with accessible labels (SC 1.3.1) |
| Status badges (Pending / Active / Completed) | Must not rely on colour alone — icon + text required (SC 1.4.1) |

### 5.4 Compliance Report Generation

| Feature | Accessibility Requirement |
|---|---|
| Report configuration form | Full keyboard access, labels for all inputs, error prevention before submission (SC 3.3.4) |
| Generated PDF reports | Must meet PDF/UA standard — tagged PDF, reading order, alt text for charts (EN 301 549 Clause 10) |
| Excel / CSV exports | Column headers, sheet names must be descriptive |
| Report preview modal | Modal focus management, keyboard close, screen reader announcement on open (SC 2.1.1) |

### 5.5 Competency Rule Authoring

| Feature | Accessibility Requirement |
|---|---|
| Rule builder drag-and-drop | Must have single-pointer keyboard alternative for all drag operations (SC 2.5.7, WCAG 2.2) |
| Condition logic editor | All inputs fully labelled, complex component exposes ARIA tree or group roles (SC 4.1.2) |
| Rule validation errors | Error messages clearly associated with offending field via `aria-describedby` (SC 3.3.1) |
| Rule save / activate confirmation | Confirmation dialog required before activation — error prevention (SC 3.3.4) |

### 5.6 Authentication

| Feature | Accessibility Requirement |
|---|---|
| Login form | Labels for all inputs, no CAPTCHA without alternative, error messages on failure (SC 3.3.8) |
| MFA prompt | Clear instruction text, timeout warning before code expires (SC 2.2.1) |
| SSO redirect | User notified before redirect — no unexpected context change (SC 3.2.1) |
| Session timeout | Warning modal with option to extend, keyboard accessible dismiss (SC 2.2.1) |

---

## 6. Accessibility Architecture Requirements

The following architectural decisions must be made to support accessibility compliance across the platform:

| Layer | Requirement |
|---|---|
| **Frontend component library** | Must be built on or validated against an accessible component system (e.g., Radix UI, Adobe React Spectrum, or ARIA APG patterns) |
| **Design system** | Must enforce colour contrast ratios (4.5:1 text, 3:1 UI components), focus ring styles, and minimum target sizes |
| **ARIA implementation standard** | All custom components (charts, badges, modals, drag-and-drop) must implement ARIA roles, states, and properties per the ARIA Authoring Practices Guide (APG) |
| **HTML semantics** | Semantic HTML5 elements must be used throughout — no `div`-only structures for interactive elements |
| **Server-side rendering (SSR)** | Content must be accessible before JavaScript loads — critical for screen reader initial page load |
| **Internationalisation (i18n)** | `lang` attribute must be set per page and per content block for multi-language tenants |
| **PDF generation engine** | Must produce tagged PDF (PDF/UA compliant) — consider tools like Prince XML, PDFlib, or Apache FOP with accessibility output |
| **Video player** | Must support closed captions (VTT format), audio descriptions, keyboard controls, and screen reader announcements |
| **CI/CD pipeline** | Automated accessibility testing must be integrated at build and deploy stages |

---

## 7. Accessibility Testing Strategy

### 7.1 Automated Testing (Catches ~30–40% of Issues)

| Tool | What It Tests | Integration Point |
|---|---|---|
| **axe-core** | WCAG 2.1 AA automated rules — ~55 rules | Unit tests, CI pipeline, browser extension |
| **Lighthouse** | Accessibility audit score, contrast, labels | CI/CD pipeline, PR checks |
| **Pa11y** | Automated page-level accessibility scan | Scheduled regression scans |
| **eslint-plugin-jsx-a11y** | React component accessibility linting | Local development, pre-commit hook |
| **Storybook a11y addon** | Component-level accessibility testing | Component library CI |

### 7.2 Manual Testing (Required for Full Compliance)

| Test Type | Tools / Method | Frequency |
|---|---|---|
| **Screen reader testing** | NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari | Every major feature release |
| **Keyboard-only navigation** | Tab, Shift+Tab, Enter, Space, Arrow keys — no mouse | Every sprint |
| **Zoom / magnification testing** | Browser zoom 200%, 400% — Windows Magnifier | Every major release |
| **Colour contrast audit** | Colour Contrast Analyser, Figma Contrast plugin | Design review stage |
| **Cognitive accessibility review** | Plain language check, consistent labelling audit | Quarterly |
| **Mobile accessibility testing** | TalkBack (Android), VoiceOver (iOS) | Every mobile release |

### 7.3 External Audit

| Activity | Frequency | Output |
|---|---|---|
| Third-party WCAG 2.1 AA conformance audit | Annually + before major releases | Accessibility Conformance Report (ACR / VPAT) |
| Penetration test for accessibility bypass vectors | Annually | Security + accessibility combined report |
| User testing with disabled participants | Bi-annually | Qualitative findings report |

---

## 8. Required Deliverables for EAA Compliance

| Deliverable | Description | Owner | Status |
|---|---|---|---|
| **Accessibility Statement** | Published statement per product declaring conformance level, known issues, and contact for feedback | Product / Legal | ❌ Not yet created |
| **Accessibility Conformance Report (ACR / VPAT)** | Detailed mapping of each WCAG SC to pass / partial / fail / not applicable | QA / Accessibility Lead | ❌ Not yet created |
| **Feedback Mechanism** | In-product way for users to report accessibility barriers with defined response SLA | Product / Support | ❌ Not yet implemented |
| **Remediation Register** | Tracked log of known accessibility issues, severity, and target fix date | QA | ❌ Not yet created |
| **Accessible PDF Template Library** | All compliance report templates must output tagged, accessible PDFs | Engineering | ❌ Not yet created |
| **Accessibility Test Suite** | Automated axe-core + Pa11y tests in CI/CD | Engineering | ❌ Not yet implemented |
| **Design System Accessibility Guidelines** | Contrast ratios, focus styles, target sizes, ARIA patterns documented | Design | ❌ Not yet created |

---

## 9. Architecture Gaps Summary

| Gap | Standard Violated | Priority | Recommended Fix |
|---|---|---|---|
| No accessibility conformance statement | EAA Art.13 | 🔴 Critical | Publish VPAT / ACR per product on trust portal |
| No WCAG 2.1 AA requirement in UI component standards | EN 301 549 Clause 9 | 🔴 Critical | Mandate accessible component library in frontend architecture |
| No user feedback / accessibility reporting mechanism | EAA Art.13(3) | 🔴 Critical | Add in-product feedback widget with email/ticket routing |
| No caption / audio description requirement for training videos | EN 301 549 Clause 7 | 🔴 Critical | Require VTT captions on all video content at upload |
| No accessible PDF output from report generation engine | EN 301 549 Clause 10 | 🔴 Critical | Adopt PDF/UA-compliant generation library |
| No automated accessibility testing in CI/CD | Best practice — EAA | 🔴 Critical | Integrate axe-core and Lighthouse in PR pipeline |
| No ARIA implementation standard for custom components | WCAG 2.1 SC 4.1.2 | 🟠 High | Define ARIA component patterns in design system |
| No keyboard navigation testing requirement | WCAG 2.1 SC 2.1.1 | 🟠 High | Add keyboard-only test pass to definition of done |
| No colour contrast enforcement in design system | WCAG 2.1 SC 1.4.3 | 🟠 High | Enforce 4.5:1 text / 3:1 UI minimum in design tokens |
| No accessible authentication alternative | WCAG 2.2 SC 3.3.8 | 🟠 High | Use SSO / passkeys — eliminate cognitive CAPTCHA |
| No target size standard for UI components | WCAG 2.2 SC 2.5.8 | 🟡 Medium | Enforce 24x24px minimum in design system tokens |
| No drag-and-drop keyboard alternative in rule builder | WCAG 2.2 SC 2.5.7 | 🟡 Medium | Add keyboard-based reorder controls alongside drag targets |
| No `lang` attribute standard in multi-tenant portal | WCAG 2.1 SC 3.1.1 | 🟡 Medium | Set `lang` from tenant locale config at page render |
| No skip navigation links | WCAG 2.1 SC 2.4.1 | 🟡 Medium | Add skip-to-content link as first focusable element |

---

## 10. Implementation Roadmap

### Phase 1 — Immediate Compliance Blockers (Month 1–2)

- [ ] Publish Accessibility Statement for all user-facing portals
- [ ] Implement in-product accessibility feedback mechanism
- [ ] Integrate axe-core into CI/CD pipeline — fail build on Critical and Serious violations
- [ ] Enforce colour contrast ratios (4.5:1 / 3:1) across all design tokens
- [ ] Add skip-to-content link to all page templates
- [ ] Ensure all form inputs have associated `<label>` elements
- [ ] Replace colour-only risk indicators with colour + text + icon combination
- [ ] Add `lang` attribute to all page templates — driven by tenant locale setting

### Phase 2 — Core WCAG 2.1 AA Compliance (Month 2–4)

- [ ] Audit and fix keyboard navigation across all workflows
- [ ] Implement focus management in all modal dialogs
- [ ] Add `aria-live` regions for all dynamic content updates (notifications, risk score changes)
- [ ] Implement ARIA roles on all custom components (charts, badges, rule editor, timeline)
- [ ] Add session timeout warning with accessible extend option
- [ ] Ensure all tables in reports have proper `<th>` and `scope` attributes
- [ ] Add text alternatives for all charts and graphs (data table equivalent)
- [ ] Mandate VTT closed captions for all training video content uploads

### Phase 3 — WCAG 2.2 and Document Accessibility (Month 4–6)

- [ ] Adopt PDF/UA-compliant report generation library
- [ ] Enforce 24x24px minimum target size across all UI components
- [ ] Add keyboard alternative for all drag-and-drop interactions in rule builder
- [ ] Implement accessible authentication (SSO / passkeys — remove cognitive CAPTCHA)
- [ ] Eliminate redundant data entry in multi-step forms
- [ ] Add consistent help link location across all portals
- [ ] Complete and publish full VPAT / ACR

### Phase 4 — Ongoing Compliance (Quarterly)

- [ ] Manual screen reader testing (NVDA, JAWS, VoiceOver) each major release
- [ ] Annual third-party WCAG 2.1 AA conformance audit
- [ ] Bi-annual user testing sessions with disabled participants
- [ ] Quarterly review of EN 301 549 updates as WCAG 2.2 adoption progresses
- [ ] Monitor WCAG 3.0 draft progress — plan adoption timeline when finalised

---

## 11. Compliance Priority Matrix

| Regulation | Risk if Non-Compliant | Effort | Priority |
|---|---|---|---|
| **EAA (EU-wide)** | Fines per member state, market access risk across 27 countries | High | 🔴 Critical |
| **EN 301 549 / WCAG 2.1 AA** | Non-conformance with EAA technical standard | High | 🔴 Critical |
| **WAD (Public Sector)** | Exclusion from public sector procurement in EU | Medium | 🟠 High |
| **UK Equality Act 2010** | Legal action by disabled employees of UK tenants | Medium | 🟠 High |
| **Section 508 (US Federal)** | Exclusion from US federal government contracts | Medium | 🟠 High |
| **WCAG 2.2 AA** | Not yet mandated — but expected in EN 301 549 update | Low | 🟡 Medium |
| **ADA (US)** | Litigation risk — case law expanding to digital services | Low | 🟡 Medium |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **EAA** | European Accessibility Act — EU Directive 2019/882 mandating accessible digital services |
| **EN 301 549** | European ICT accessibility standard incorporating WCAG 2.1 AA |
| **WCAG** | Web Content Accessibility Guidelines — international standard published by W3C |
| **WAD** | Web Accessibility Directive — EU Directive 2016/2102 for public sector bodies |
| **VPAT** | Voluntary Product Accessibility Template — document declaring conformance to accessibility standards |
| **ACR** | Accessibility Conformance Report — completed VPAT |
| **ARIA** | Accessible Rich Internet Applications — W3C specification for accessibility semantics in HTML |
| **APG** | ARIA Authoring Practices Guide — W3C guidance for implementing ARIA patterns |
| **PDF/UA** | PDF Universal Accessibility — ISO standard 14289 for accessible PDF documents |
| **axe-core** | Open-source accessibility testing engine used in automated pipelines |
| **JAWS** | Job Access With Speech — leading commercial screen reader for Windows |
| **NVDA** | NonVisual Desktop Access — free open-source screen reader for Windows |
| **VoiceOver** | Built-in screen reader for macOS and iOS |
| **TalkBack** | Built-in screen reader for Android |
| **SC** | Success Criterion — individual testable requirement within WCAG |
| **VTT** | Web Video Text Tracks — standard format for video captions and subtitles |

---

*Document generated from architecture review of the Corporate L&D SaaS platform. Cross-references: `01-architecture.md`, `Global_Compliance_Regulations_LD_System.md`, `Corporate-Learning-System-Problem-Statement-3.txt`.*
