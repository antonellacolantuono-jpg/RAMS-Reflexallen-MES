# MASTER BACKLOG — RAMS Reflexallen MES

> **Purpose**: Single source of truth for ALL residual work beyond the PROMPT roadmap.
> **Last updated**: 2026-05-03 (after D2 Batch 1+2 of PROMPT_DESIGN_ALIGNMENT)
> **Owners**: Antonella + Claude (planning), Claude Code (implementation)
> **Status**: Living document — update at every PROMPT closure

---

## Index

- [§ 1 — Roadmap PROMPT pianificati](#1-roadmap-prompt-pianificati)
- [§ 2 — TODO numerati tracciati](#2-todo-numerati-tracciati)
- [§ 3 — Pre-MVP ship critici (Tier 1)](#3-pre-mvp-ship-critici-tier-1)
- [§ 4 — Pre-MVP ship important (Tier 2)](#4-pre-mvp-ship-important-tier-2)
- [§ 5 — Post-MVP polish (Tier 3)](#5-post-mvp-polish-tier-3)
- [§ 6 — V2 backlog explicit](#6-v2-backlog-explicit)
- [§ 7 — Demo prep + documentation](#7-demo-prep--documentation)
- [§ 8 — Effort summary](#8-effort-summary)
- [§ 9 — Decision queue](#9-decision-queue)

---

## 1. Roadmap PROMPT pianificati

Order of execution + status. **This is what gets done in PROMPTs**.

| # | PROMPT | Effort CC | Calendar | Status |
|---|---|---|---|---|
| 1 | **PROMPT_DESIGN_ALIGNMENT** (full app + ex-PROMPT_7 D2/D3) | ~19-22h | 3-7 mag | 🟡 D2 Batch 1+2 done |
| 2 | **PROMPT_7_RESUME** (HMI runtime recoveryConfig + pre-retry execution) | 1h | 7-8 mag | ⏳ |
| 3 | **PROMPT_3c** (Workflow Live Preview state-driven) | 1.5-2h | 8-9 mag | ⏳ |
| 4 | **PROMPT_AUTH_BASIC** (NEW — login web + ruoli base + permission checks) | 6-7h | 9-11 mag | ⏳ TBD inserire (Tier 1) |
| 5 | **PROMPT_9** (Equipment + Maintenance + Tool Wear + Recovery 4-stage) | 3-4h | 11-13 mag | ⏳ |
| 6 | **DEMO PREP** (slide + dress rehearsal) | — (tuo) | 14-17 mag | ⏳ |
| 7 | **🎯 DEMO REFLEX ALLEN** | — | **18-22 mag** | 🎯 |
| 8 | Post-demo feedback absorb | — | 23-24 mag | ⏳ |
| 9 | **PROMPT_10** (Industrial Operations) | 3-4h | 23-25 mag | ⏳ |
| 10 | **PROMPT_11** (CFRP Module) | 3-4h | 26-29 mag | ⏳ |
| 11 | **PROMPT_12** (Safety Devices Module) | 3-4h | 30 mag - 2 giu | ⏳ |
| 12 | **PROMPT_13** (Audit + Genealogy + Skills Matrix + KPI) | 2-3h | 3-5 giu | ⏳ |
| 13 | **PROMPT_DEPLOYMENT** (NEW — production stack: PostgreSQL + Docker + Redis + Worker + nginx + SSL) | 18-21h | 5-12 giu | ⏳ TBD inserire (Tier 1) |
| 14 | **PROMPT_E2E_TESTS** (NEW — 6 critical flows Playwright) | 10h | 12-15 giu | ⏳ TBD inserire (Tier 2) |
| 15 | **UAT finale + bug fix** | — | 15-18 giu | ⏳ |
| 16 | **🚀 MVP SHIP** | — | **18-22 giu** (slipped da 13-15 giu se Tier 1+2 inseriti) | 🚀 |
| 17 | **PROMPT_6** (Andon dashboard) — opzionale post-MVP | 1-2h | post-MVP | 🟢 |

**Roadmap totale rimanente**: ~70-90h Claude Code (incl. NEW PROMPTs Tier 1+2).

---

## 2. TODO numerati tracciati

12 TODO aperti dai docs di progetto.

| # | TODO | Effort | Owner | Status |
|---|---|---|---|---|
| TODO-033 | Audit adapter | 30 min | PROMPT_DESIGN_ALIGNMENT D2 | 🟡 in corso |
| TODO-035 | Parallel view editing | 1h | F2 backlog post-demo | ⏳ |
| TODO-036 | Decision step schema fields | 1h | F2 backlog post-demo | ⏳ |
| TODO-037 | @mes/ui Edge harmonization | 30 min | PROMPT_DESIGN_ALIGNMENT D2 | 🟡 in corso |
| TODO-038 | Workflow-meta editing topbar | 30 min | PROMPT_DESIGN_ALIGNMENT D2 | 🟡 in corso |
| TODO-039 | Design token migration `bg-primary-*` | 30 min | PROMPT_DESIGN_ALIGNMENT D2 (assorbito Batch 2) | ✅ done |
| TODO-040 | Recovery runtime + pre-retry execution | 1h | PROMPT_7_RESUME | ⏳ |
| TODO-041 | Split FaultCode da CauseCode | 1h | post-demo | ⏳ |
| TODO-042 | PROMPT spec rewrite hygiene | 30 min | meta-task ongoing | 🟡 |
| TODO-044 | WebSocket /demo cache invalidation | 1.5h | post-demo | ⏳ |
| TODO-045 | Resource Mobility (start location + allowed workflows) | 1.5-2h | post-demo F2 | ⏳ |
| TODO-046 | Lesson 59 worktree recovery (doc) | 15 min | DESIGN_ALIGNMENT D4 closure | ⏳ |
| TODO-047 (NEW) | HMIBOMCheck dedicated gate (mockup feature) | 2h | post-demo polish | ⏳ |

**Totale TODO non-assorbiti**: ~9.5h post-demo.

---

## 3. Pre-MVP ship critici (Tier 1)

**Senza questi NON si può shippare in produzione**.

### 3.1 Auth + Permissions basic 🔴 (~6-7h)

**Why critical**: oggi web back-office è "open" (chiunque accede al planner board, può rilasciare WO, modificare workflow). HMI ha solo login operatore con badge+PIN. Nessun ruolo, nessun permission check.

| Sub-feature | Effort |
|---|---|
| Login web back-office page | 1.5h |
| Role-based permission system (operator / planner / supervisor / admin) | 2h |
| JWT token refresh flow (15min access + 7d refresh) | 1h |
| Permission checks server-side su API endpoints critici | 1.5h |
| Logout + session expiry handling | 30 min |
| Profilo utente UI minimale | 30 min |

**Proposed PROMPT_AUTH_BASIC** — calendario 9-11 mag (pre-demo). Per demo: customer vede "ruoli + permission" come highlight enterprise.

**Rischio se deferred**: production deploy con weak auth = vulnerability seria.

### 3.2 Production deployment 🔴 (~18-21h)

**Why critical**: oggi il MES gira in DEV MODE con SQLite + in-memory cache + sync queue + local storage. Per shippare a Reflex Allen serve full production stack.

| Sub-feature | Effort |
|---|---|
| PostgreSQL migration da SQLite | 2-3h |
| Docker prod images (api + web + hmi) | 3-4h |
| Redis setup per cache + queue | 2h |
| MinIO/S3 storage setup | 2h |
| Worker app (BullMQ standalone) | 3-4h |
| Environment configs (dev/staging/prod) | 2h |
| Secrets management (vault o env-encrypted) | 1.5h |
| Reverse proxy (nginx/caddy) | 1h |
| SSL certificates setup | 30 min |
| Database backup strategy | 1h |

**Proposed PROMPT_DEPLOYMENT** — calendario 5-12 giu (pre-MVP ship).

**Rischio se deferred**: SQLite NON regge produzione, in-memory cache NON regge multi-instance, sync queue blocca request thread.

### 3.3 E2E tests Playwright 🔴 (~10h)

**Why critical**: oggi smoke gate è 100% manuale. Pre-ship serve coverage automatica dei 6 user journey più critici.

| Critical flow E2E | Effort |
|---|---|
| Operator login → start WO → execute steps → complete | 2h |
| Process Engineer: workflow create → approve → release WO | 2h |
| Quality Manager: review scrap → analyze causes → export | 1.5h |
| Plant Manager: dashboard → real-time production | 1h |
| Auto-gen: release WO → setup steps appear in HMI | 1.5h |
| Recovery: step fails → diagnosis → retry → success/scrap | 1.5h |
| Setup CI integration | 30 min |

**Proposed PROMPT_E2E_TESTS** — calendario 12-15 giu (pre-ship final).

**Rischio se deferred**: ogni release richiede smoke manuale 2h+.

---

## 4. Pre-MVP ship important (Tier 2)

**Strongly recommended ma deferable a 1.0.1 patch release**.

### 4.1 Notifications & Alerts 🟡 (~3-5h)

| Sub-feature | Effort |
|---|---|
| Sound/audio feedback HMI (success/error/scan) | 30 min |
| Real-time WebSocket alerts (live alert panel) | 2h |
| Email notifications (config + send via nodemailer) | 2-3h |

**Sound HMI** = **quick win pre-demo** (30 min). Inserire in PROMPT_DESIGN_ALIGNMENT D3 batch 4.5 forse.

### 4.2 Reporting & Analytics gap 🟡 (~7-9h)

| Sub-feature | Effort |
|---|---|
| Scrap rate by cause analysis dashboard | 2h |
| Daily production summary report | 2h |
| Export to Excel (XLSX) per registry | 1.5h |
| Export to PDF per WO completion certificate | 2h |
| OEE/FPY/Throughput refinement | 1.5h |

**Proposed PROMPT_REPORTING_EXPORT** — post PROMPT_13.

### 4.3 Industrial Operations residui 🟡 (~3.5h)

PROMPT_10 copre 6/9 features. Gaps:
- Continuous production mode (vs discrete) — 1.5h
- Material consumption non-discrete (granuli, kg, etc.) — 1h
- Operator visual confirmation con photo — 1h

### 4.4 CI/CD pipeline 🟡 (~7-8h)

| Sub-feature | Effort |
|---|---|
| GitHub Actions setup | 1.5h |
| Lint + typecheck + test on PR | 30 min |
| Build verification | 30 min |
| Auto-deploy to staging | 2h |
| Auto-deploy to production (manual approval gate) | 1.5h |
| Coverage reporting | 1h |
| Bundle size monitoring | 30 min |
| Security scan (Snyk/Dependabot) | 30 min |

**Proposed PROMPT_CICD** — pre-ship.

### 4.5 Quality Control gap 🟡 (~3.5h)

| Sub-feature | Effort |
|---|---|
| Defect categorization UI (oltre cause codes) | 1h |
| Sample test results visualization | 1h |
| Quality Hold workflow UI completo | 1.5h |

### 4.6 Box Management UI completo 🟡 (~4h)

| Sub-feature | Effort |
|---|---|
| Pack into box flow HMI completo (scan box → confirm contents → seal) | 2h |
| Box lifecycle UI back-office | 1.5h |
| SealNumberDisplay print | 30 min |

---

## 5. Post-MVP polish (Tier 3)

**Defer a 1.0.1 / 1.1.0 unless customer feedback drives priority**.

### 5.1 Monitoring & Observability 🟢 (~10-11h)

| Sub-feature | Effort |
|---|---|
| Pino structured logging wired | 1h |
| Correlation ID tracking | 1h |
| Application Performance Monitoring (APM) | 2h |
| Error tracking (Sentry) | 1.5h |
| Metrics dashboard (Prometheus + Grafana) | 3-4h |
| Alerting on errors/downtime | 1.5h |

### 5.2 Performance testing 🟢 (~6h)

| Sub-feature | Effort |
|---|---|
| Load testing setup (k6 o JMeter) | 2h |
| Concurrent user simulation | 1h |
| Database query optimization audit | 2h |
| Bundle size optimization | 1h |

### 5.3 Accessibility audit 🟢 (~5-7h)

WCAG 2.1 AA compliance check + fixes.

### 5.4 Skills Matrix UI (PROMPT_13 default base; full matrix in polish) 🟢 (~2h)

C3 deferred from PROMPT_DESIGN_ALIGNMENT — implementare /skills/matrix come operatore × skill grid.

### 5.5 Equipment full rebuild 🟢 (~3h)

C2 deferred from PROMPT_DESIGN_ALIGNMENT — full equipment hierarchy + detail rebuild.

### 5.6 PROMPT_PNE_5 (auto-trigger label + warning step + conditional Packaging) 🟢 (~4-6h)

Demo customer non lo richiede esplicitamente. Add se feedback positive.

---

## 6. V2 backlog explicit

**Out of MVP scope esplicito**.

### 6.1 Compliance regulated industries

- FDA 21 CFR Part 11: electronic signatures + tamper-proof audit + retention 15+ years + MFA — ~11-12h
- GDPR compliance: privacy policy + cookie consent + data export/deletion + anonymization — ~7h

### 6.2 Quality Module advanced

- NCR (Non-Conformance Report) workflow
- Deviation/Hold/Use-as-is dispositions
- SPC (Statistical Process Control) charts
- 21 CFR Part 11 electronic signatures
- Recall management
- Customer audit reports

### 6.3 Production advanced

- Schedulazione finita with Gantt drag-drop
- What-if simulation
- Calibration tracking module
- Custom report builder
- Multi-tier approval workflows

### 6.4 Integration

- IIoT real connectors (OPC UA, MQTT, Modbus)
- ERP bidirectional sync (SAP, Odoo)
- WMS integration
- Email/SMS/Teams notifications avanzate
- Voice notes, OCR documents

### 6.5 Collaboration

- Real-time multi-user editing on canvas (Yjs/Liveblocks)
- Comments threads with mentions
- Video annotations

### 6.6 Multi-language + Multi-plant

- English (EN) bilingual i18n
- Multi-plant active UI selector
- Plant-specific configurations

### 6.7 Mobile

- Mobile back-office (currently desktop-primary)
- Mobile native apps

### 6.8 Lines V2

- Fluid Power Module (5 features)
- Digital Electrical Module (5 features)

---

## 7. Demo prep + documentation

**Tuo effort, non Claude Code**.

### 7.1 Demo prep (~10-13h tuo)

- Slide narration 18-20 min (4-6h)
- 3 user journey scripts (Process Eng / Planner / Operator) (2-3h)
- Backup DB snapshot per demo (1h)
- Final dress rehearsal (2h)
- Demo environment setup (1h)

### 7.2 Documentation (~10h tuo + 1h CC review)

- User manual operatore HMI (3h)
- User manual back-office planner (3h)
- Admin guide deployment + config (2h)
- Troubleshooting guide (1.5h)
- API docs review (1h CC)

---

## 8. Effort summary

### Tier 1 (Critical pre-MVP ship — non saltabili)

| Item | Effort CC |
|---|---|
| Roadmap PROMPT pianificati (DESIGN + 7_RESUME + 3c + 9 + 10/11/12/13 + 6) | ~21-29h |
| Auth basic | ~6-7h |
| Production deployment | ~18-21h |
| E2E tests | ~10h |
| Sound HMI (quick win) | 30 min |
| **TOTALE Tier 1** | **~56-67h** |

### Tier 2 (Important — recommended pre-MVP, deferable to 1.0.1)

| Item | Effort CC |
|---|---|
| Notifications & Alerts | ~3-5h |
| Reporting & Analytics gap | ~7-9h |
| Industrial Operations residui | ~3.5h |
| CI/CD pipeline | ~7-8h |
| Quality Control gap | ~3.5h |
| Box Management UI completo | ~4h |
| **TOTALE Tier 2** | **~28-33h** |

### Tier 3 (Polish post-MVP)

| Item | Effort CC |
|---|---|
| Monitoring & Observability | ~10-11h |
| Performance testing | ~6h |
| Accessibility audit | ~5-7h |
| Skills Matrix UI | 2h |
| Equipment full rebuild | 3h |
| PROMPT_PNE_5 | ~4-6h |
| TODO residui (035, 036, 041, 044, 045) | ~6h |
| HMIBOMCheck dedicated (TODO-047) | 2h |
| **TOTALE Tier 3** | **~38-43h** |

### Effort totali project

| Category | Effort CC | Effort tuo |
|---|---|---|
| Tier 1 | 56-67h | — |
| Tier 2 | 28-33h | — |
| Tier 3 | 38-43h | — |
| Demo + Docs | ~1h | ~22-27h |
| **TOTALE** | **~123-144h** | **~22-27h** |

---

## 9. Decision queue

Open decisions per le quali aspetto direzione utente.

### D1 — Strategy ship date (decide post PROMPT_DESIGN_ALIGNMENT D4 closure ~7-8 mag)

| Strategy | Tier 1 | Tier 2 | Tier 3 | Ship date |
|---|---|---|---|---|
| **A — Aggressive** | Auth solo demo mode (~2h) | skip | skip | 13-15 giu (target originale) |
| **B — Realistic** ⭐ | Auth full + Deployment + E2E | skip | skip | 18-22 giu |
| **C — Conservative** | Tier 1 full | Tier 2 full | skip | 25-30 giu |
| **D — Demo-driven** | TBD post-feedback | TBD | TBD | 25 giu - 5 lug |

**Mia raccomandazione**: B (Realistic).

### D2 — Sound HMI inserimento (decide pre-demo ~12-13 mag)

Sound HMI feedback è quick win 30 min. Lo inseriamo in PROMPT_DESIGN_ALIGNMENT D3 batch 4.5 (con HMI Shell) oppure come patch a parte?

**Mia raccomandazione**: inserire in HMI Shell batch 4.5 (no overhead extra).

### D3 — Auth basic timing (decide post Tier 1 commit)

PROMPT_AUTH_BASIC va prima o dopo PROMPT_9?

**Mia raccomandazione**: prima (9-11 mag), così demo customer vede sistema completo with auth.

### D4 — PROMPT_6 Andon (decide post-demo 22-23 mag)

Customer feedback determina priorità. Possibili outcomes:
- "Customer ha apprezzato dashboard live" → build Andon (~2h)
- "Customer non ha menzionato Andon" → defer post-MVP

### D5 — Documentation owner (decide pre-ship)

Tu scrivi docs (10h) o assumiamo a Claude Code (1-2h con tuo review)?

**Mia raccomandazione**: split. Tu scrivi user manual operatore (più contesto domain-specific), Claude Code prima draft di admin/troubleshooting/API docs.

---

## 10. Update log

| Date | Update |
|---|---|
| 2026-05-03 | Initial document v1.0 — full inventory after PROMPT_7 D1 merged + DESIGN_ALIGNMENT D2 Batch 1+2 done |

---

## How to keep this doc fresh

1. **Each PROMPT closure**: update § 1 status, mark TODO closed in § 2, add new TODOs surfaced
2. **Each surprise/decision**: log in § 9 Decision queue if open, or document closure in update log
3. **Each Tier 1/2 item completed**: move from § 3-4 to "✅ done" with commit ref
4. **Strategy decisions**: update § 8 effort summary if scope changes
5. **Maintain calendar consistency** between § 1 PROMPT calendar and ship date in § 9 D1

End of MASTER_BACKLOG.md
