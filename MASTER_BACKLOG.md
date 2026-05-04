# MASTER BACKLOG — RAMS Reflexallen MES

> **Purpose**: Single source of truth for ALL residual work beyond the PROMPT roadmap.
> **Last updated**: 2026-05-03 (PROMPT_DESIGN_ALIGNMENT D4 closure — full app aligned to mockup, +128 tests, 898 total)
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
| 1 | **PROMPT_DESIGN_ALIGNMENT** (full app + ex-PROMPT_7 D2/D3) | ~22h actual | 3-7 mag | ✅ done 2026-05-03 |
| 2 | **PROMPT_7_RESUME** (HMI runtime recoveryConfig + pre-retry execution) | 1-2h | 7-8 mag | ✅ done 2026-05-03 |
| 3 | **PROMPT_3c** (Workflow Live Preview state-driven) | 1.5-2h | 8-9 mag | ✅ done 2026-05-03 (commit `cac1390`) |
| 4 | **PROMPT_9** (Equipment + Maintenance + Tool Wear) — **REDUCED SCOPE** (no Recovery 4-stage; tool wear hook + MaintenanceOrder CRUD + Dashboard nav only) | ~2-2.5h | **5-7 mag** (anticipated, was 11-13 mag) | ✅ done 2026-05-04 (commit `4a1d875`) |
| 5 | **PROMPT_VIEWSWITCHER_WORKFLOWS** (Tabella gerarchica + Card view + ViewSwitcher; sidebar Lucide migration; bonus WO Detail Snapshot tab) | ~3-3.5h | 5-6 mag | ✅ done 2026-05-05 |
| 6 | **DEMO PREP** (slide + dress rehearsal) | — (tuo) | 14-17 mag | ⏳ |
| 7 | **🎯 DEMO REFLEX ALLEN** | — | **18-22 mag** | 🎯 |
| 8 | Post-demo feedback absorb | — | 23-24 mag | ⏳ |
| 9 | **PROMPT_10** (Industrial Operations) | 3-4h | 23-25 mag | ⏳ |
| 10 | **PROMPT_11** (CFRP Module) | 3-4h | 26-29 mag | ⏳ |
| 11 | **PROMPT_12** (Safety Devices Module) | 3-4h | 30 mag - 2 giu | ⏳ |
| 12 | **PROMPT_13** (Audit + Genealogy + Skills Matrix + KPI) | 2-3h | 3-5 giu | ⏳ |
| 13 | **PROMPT_DEPLOYMENT + AUTH_BASIC merged** (NEW — production stack: PostgreSQL + Docker + Redis + Worker + nginx + SSL **+ AUTH_BASIC merged here per D3 2026-05-04**) | 24-28h | 5-12 giu | ⏳ TBD inserire (Tier 1) |
| 14 | **PROMPT_E2E_TESTS** (NEW — 6 critical flows Playwright) | 10h | 12-15 giu | ⏳ TBD inserire (Tier 2) |
| 15 | **UAT finale + bug fix** | — | 15-18 giu | ⏳ |
| 16 | **🚀 MVP SHIP** | — | **18-22 giu** (slipped da 13-15 giu se Tier 1+2 inseriti) | 🚀 |
| 17 | **PROMPT_6** (Andon dashboard) — opzionale post-MVP | 1-2h | post-MVP | 🟢 |

**Roadmap totale rimanente**: ~70-90h Claude Code (incl. NEW PROMPTs Tier 1+2).

---

## 2. TODO numerati tracciati

Open numbered TODOs in the project. Last review: 2026-05-03 post DESIGN_ALIGNMENT D4 closure.

| # | TODO | Effort | Owner | Status |
|---|---|---|---|---|
| TODO-033 | Audit adapter API row → AuditTimelineEntry | 30 min | F2 / PROMPT_7 | ⏳ |
| TODO-035 | Parallel view editing | 1h | F2 backlog post-demo | ⏳ |
| TODO-036 | Decision step schema fields | 1h | F2 backlog post-demo | ⏳ |
| TODO-037 | @mes/ui Edge harmonization | 30 min | F2 (Option B documented) | ⏳ |
| TODO-038 | Workflow-meta editing topbar | 30 min | F2 / PROMPT_7 | ⏳ |
| TODO-039 | Design token migration `bg-primary-*` | 30 min | DESIGN_ALIGNMENT D2 Batch 2 | ✅ done 2026-05-03 |
| TODO-040 | Recovery runtime + pre-retry execution | 1-2h | PROMPT_7_RESUME (next) | ⏳ |
| TODO-041 | Split FaultCode da CauseCode | 1h | post-demo F2 | ⏳ |
| TODO-042 | PROMPT spec rewrite hygiene | 30 min | meta-task ongoing | 🟡 |
| TODO-044 | DemoToggle WebSocket replace polling | 1.5h | post-demo F2 / PROMPT_7 | ⏳ |
| TODO-045 | Resource Mobility (start location + allowed workflows) | 1.5-2h | post-demo F2 | ⏳ |
| TODO-046 | Lesson 59 worktree recovery (doc) | 15 min | DESIGN_ALIGNMENT D4 closure | ✅ done 2026-05-03 (in STATUS.md Lessons 59+60) |
| TODO-047 | HMIBOMCheck dedicated gate (mockup feature) | 2h | post-demo polish | ⏳ |
| TODO-049 (NEW) | BoM lines not persisted on create/update | 2h backend + 2h FE | post-demo F2 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 7.1 |
| TODO-050 (NEW) | Recipe parameters/versions not persisted | 2h backend + 2h FE | post-demo F2 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 7.1 |
| TODO-052 (NEW) | Equipment ISA-95 tree visualization (`Tree` primitive missing) | 3h DS + 2h FE | F3.2 PROMPT_9 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 7.2 |
| TODO-053 (NEW) | Skills × Operators matrix view (controller route missing) | 2h backend + 3h FE | F3.6 PROMPT_13 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 7.2 |
| TODO-054 (NEW) | Operator-Skill assignment editor (controller routes missing) | 3h backend + 3h FE | F3.6 PROMPT_13 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 7.2 |
| TODO-055 | Move `deriveEquipmentCounts` helper out of Next.js page file | 15 min | DESIGN_ALIGNMENT D4 closure | ✅ done 2026-05-03 |
| TODO-056 (NEW) | Multi-level timer aggregation on WO BO Steps tab | 2h | F3.2 PROMPT_9 | ⏳ opened DESIGN_ALIGNMENT D3 Batch 9 |

**Totale TODO non-assorbiti aperti**: ~22-30h post-demo (was ~9.5h pre-DESIGN_ALIGNMENT — net +12h from Batch 7.x surfaced gaps and Batch 9 timer aggregation).

**Closed by DESIGN_ALIGNMENT**: TODO-039 (D2 Batch 2 token alignment), TODO-046 (D4 closure Lessons 59+60), TODO-055 (D4 closure helpers extract).

---

## 3. Pre-MVP ship critici (Tier 1)

**Senza questi NON si può shippare in produzione**.

### 3.1 Auth + Permissions basic 🔴 (~6-7h) — **DEFERRED post-demo (D3 2026-05-04)**

> **STATUS DEFERRED post-demo per D3 decision 2026-05-04** — merged into PROMPT_DEPLOYMENT (5-12 giu). Rationale: HMI auth already exists (mock functional, 4 operators seeded with Argon2id PINs from PROMPT_5_FULL D1+D2); back-office demo manageable with brief disclaimer slide. Demo Reflex Allen 18-22 mag will explicitly note "back-office auth shipping post-demo" if asked.

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

| ID | Topic | Status | Decided |
|---|---|---|---|
| D1 | Strategy ship date (B Realistic = 18-22 giu) | ✅ DECIDED | 2026-05-04 |
| D2 | Sound HMI deferred (TODO-057) | ✅ DECIDED | 2026-05-03 (DESIGN_ALIGNMENT D4 closure) |
| D3 | AUTH_BASIC deferred post-demo (merged with PROMPT_DEPLOYMENT) | ✅ DECIDED | 2026-05-04 |
| D4 | PROMPT_PNE_5 deferred post-demo | ✅ DECIDED | 2026-05-04 |
| D5 | ViewSwitcher Workflows pre-demo (NEW Q5) | ✅ DECIDED | 2026-05-04 |
| D6 | Documentation owner split tu/CC (was D5) | ⏳ OPEN — decide by 14 mag | — |
| D7 | PROMPT_6 Andon (post-demo customer feedback) | ⏳ OPEN — decide post-demo 22-23 mag | — |

### D1 — Strategy ship date ✅ DECIDED 2026-05-04: B Realistic

| Strategy | Tier 1 | Tier 2 | Tier 3 | Ship date |
|---|---|---|---|---|
| **A — Aggressive** | Auth solo demo mode (~2h) | skip | skip | 13-15 giu (target originale) |
| **B — Realistic** ⭐ ✅ | Deployment + E2E (Auth merged into Deployment) | skip | skip | **18-22 giu** (slipped +5-7 days vs target) |
| **C — Conservative** | Tier 1 full | Tier 2 full | skip | 25-30 giu |
| **D — Demo-driven** | TBD post-feedback | TBD | TBD | 25 giu - 5 lug |

**Outcome**: B Realistic adopted. Ship date 18-22 giu (slipped +5-7 days vs original target). AUTH_BASIC merged into PROMPT_DEPLOYMENT (D3).

### D2 — Sound HMI ✅ DECIDED 2026-05-03: deferred to TODO-057

D2 Batch 4.5 shipped `HMIShell` + `HMIBigBtn` primitives but did NOT include sound HMI feedback. Tracked as TODO-057 (Tier 3 polish, post-MVP). Demo path unaffected.

### D3 — AUTH_BASIC timing ✅ DECIDED 2026-05-04: DEFERRED post-demo, merged with PROMPT_DEPLOYMENT

**Outcome**: AUTH_BASIC ($\approx$6-7h) merged into PROMPT_DEPLOYMENT (5-12 giu). HMI auth already exists (mock functional, 4 operators seeded with Argon2id PINs). Back-office demo manageable with brief disclaimer slide. Net effect: PROMPT_DEPLOYMENT effort 18-21h → 24-28h.

### D4 — PROMPT_PNE_5 ✅ DECIDED 2026-05-04: deferred post-demo

Auto-trigger label + warning step + conditional Packaging — customer non lo richiede esplicitamente in demo brief. Defer to post-demo polish unless feedback positive.

### D5 — ViewSwitcher Workflows pre-demo (NEW) ✅ DECIDED 2026-05-04: pre-demo, separate batch 5-6 mag

User request 2026-05-04 to add Tabella + Card view modes to Workflow editor. Schedule: separate batch AFTER PROMPT_9 closure, calendar 5-6 mag. Bonus: WorkflowHierarchyTable component reused in WO Detail Snapshot tab + Genealogy tab (closes 2 amber-notice placeholders). Tracked as TODO-065.

### D6 — Documentation owner split (was D5) ⏳ OPEN — decide by 14 mag

Tu scrivi docs (10h) o assumiamo a Claude Code (1-2h con tuo review)?

**Mia raccomandazione**: split. Tu scrivi user manual operatore (più contesto domain-specific), Claude Code prima draft di admin/troubleshooting/API docs.

### D7 — PROMPT_6 Andon (was D4) ⏳ OPEN — decide post-demo 22-23 mag

Customer feedback determina priorità. Possibili outcomes:
- "Customer ha apprezzato dashboard live" → build Andon (~2h)
- "Customer non ha menzionato Andon" → defer post-MVP

---

## 10. Update log

| Date | Update |
|---|---|
| 2026-05-03 | Initial document v1.0 — full inventory after PROMPT_7 D1 merged + DESIGN_ALIGNMENT D2 Batch 1+2 done |
| 2026-05-03 | **PROMPT_DESIGN_ALIGNMENT closed** (D4 closure): § 1 status updated (item 1 ✅ done, item 2 ⏳ next), § 2 TODO list refreshed (TODO-039/046/055 ✅ done; TODO-049/050/052/053/054/056 NEW opened), § 9 D2 status note added. Smoke gate verified (`pnpm dev` 6/7 routes 200; `/work-orders` 404 expected). Total tests 770 → 898 (+128, zero regressions). |
| 2026-05-04 | **PROMPT_9 reduced scope in flight + Dashboard nav fix + manual smoke findings.** § 1 Roadmap: PROMPT_7_RESUME + PROMPT_3c marked ✅ done; PROMPT_9 anticipated to 5-7 mag (was 11-13 mag) with reduced scope (no Recovery 4-stage; tool wear hook + MaintenanceOrder CRUD + Dashboard nav only); NEW PROMPT_VIEWSWITCHER_WORKFLOWS scheduled 5-6 mag. § 3.1 PROMPT_AUTH_BASIC marked DEFERRED post-demo (merged with PROMPT_DEPLOYMENT, total Tier 1 effort 18-21h → 24-28h). § 9 Decision queue overhauled: D1 (Strategy B Realistic, ship 18-22 giu), D2 (Sound HMI deferred TODO-057), D3 (AUTH_BASIC deferred post-demo), D4 (PROMPT_PNE_5 deferred), D5 (ViewSwitcher Workflows pre-demo) all DECIDED. D6 (docs owner) + D7 (Andon post-demo) OPEN. NEW TODOs in TODO.md: TODO-062 (PROMPT_9 deferred items + photo storage S3 migration note), TODO-063 (Tailwind palette tokens), TODO-064 (registry ViewSwitcher), TODO-065 (Workflow ViewSwitcher pre-demo). |
| 2026-05-05 | **PROMPT_VIEWSWITCHER_WORKFLOWS done.** § 1 item 5 marked ✅ done. § 1 item 4 (PROMPT_9) closure formalized with commit ref `4a1d875`. TODO-065 (workflow editor 3-mode toggle) RESOLVED — `WorkflowHierarchyTable` (Phase>Group>Step indented table with chevron expand/collapse, +6 tests) + `WorkflowCardView` (vertical cards by phase, +3 tests) + ViewSwitcher wired with localStorage `rams.view.workflows`. Sidebar Lucide migration shipped (16 emoji → Lucide React). WO Detail Snapshot tab refactored to reuse `WorkflowHierarchyTable readOnly`. ViewSwitcher extended with optional `labels` override prop (non-breaking). Test count 971 → ~980 (+9). Remaining D5 follow-up TODO-064 (registry ViewSwitcher across 10 registries, post-demo Tier 3) still open. |
| 2026-05-04 | **GO FIX-2 Image upload + display generico done.** Closes user smoke-feedback gap "manca il fix dell'inserimento delle immagini nella pagina di dettaglio e nelle tabelle. c'è solo nello step." 7 components (A-G): new `<ImageUpload>` + `<ImageDisplay>` primitives in `@mes/ui` (5+9 vitest cases); `imageUrl String?` columns added to Item / EquipmentNode / Phase (Step keeps `data.photoUrl` end-to-end); WorkflowSnapshot serializer + projection + `cloneWorkflowTree.clonePhase` + `SourcePhase`/`ClonedPhase` types extended for Phase imageUrl (S11 trap caught in recon — explicit allowlist would have silently dropped Phase image from released WOs); 4 forms wired (Item, Equipment, Phase, Step) + legacy `PhotoUploadField` retired and AddStepDialog migrated; 7 display surfaces wired (Item+Equipment detail hero + registry list 32px thumbnail column + WorkflowHierarchyTable + WorkflowCardView + LivePreviewStepCard + HMI StepCard); Workflow Flusso canvas StepNode/PhaseNode deferred to TODO-067. NEW TODOs: TODO-066 (S3 migration), TODO-067 (Flusso canvas), TODO-068 (remaining 5 entities + Operator photoUrl wiring), TODO-069 (Item/Equipment forms RHF migration), TODO-070 (list-endpoint base64 projection optimization). Test count 998 → 1014 (+16). |
| 2026-05-04 | **GO PROMPT_15 Item Detail 360° + FourPaneConfigurator + Step.workUnitId done.** Three coordinated features delivered in a single batch closing user request "elenco di tutte le risorse, flusso di lavoro e luoghi di lavoro nel dettaglio articolo + step si crea selezionando azione, risorsa e dove". § 1 NEW item 6 added. **Component A**: 5-tab Item Detail page (Dettagli/Risorse/Workflow/Postazioni/Attività) with `?tab=` URL sync; new `ItemsService.get360()` aggregate endpoint returning BOM + tools-from-workflow-steps + skills-from-workflow-steps + workflows-strict-itemId + plant WC/WU tree + mock production stats (TODO-072); 6 new panel components in `apps/web/src/components/items/detail-360/`. `EntityDetail` extended with optional controlled `activeTab`/`onTabChange` props (backward-compat). **Component B**: new universal `FourPaneConfigurator` primitive in `@mes/ui` per MASTER_SPEC § 14.4 (4-pane responsive layout with stacked-tabs fallback <1024px). New `StepConfiguratorPane` wraps it with Hybrid scope (Main/Pre-Post/Avanzate tabs in Configuration Center) and replaces `AddStepDialog` at the page-level mount; AddStepDialog kept deprecated (TODO-071). **Component C**: nullable `Step.workUnitId` field with full snapshot round-trip (S11 cascade absorbed: `workflow-snapshot.rules.ts` SourceStep+ClonedStep+cloneStep, `release.service.ts` step serializer, `work-orders.service.ts` projection with batched `workUnit` hydration, HMI `step-execution.service.ts` DTO + 2 test fixtures + 2 round-trip assertions). Display: Postazione column in WorkflowHierarchyTable, 📍 badge in WorkflowCardView, "📍 Postazione: WS-XXX" chip in HMI StepCard. NEW TODOs: TODO-071 (AddStepDialog full removal post-demo), TODO-072 (KPI engine wiring for production stats), TODO-074 (FourPaneConfigurator universal rollout to Workflow/BOM/Recipe). Surprises absorbed: S6 (no Workflow.workCenterId — show all plant WUs), S9 (no Tool.compatibleItems — derive from workflow steps), S10 (Workflow.itemId optional — strict filter), S13 (EntityDetail tabs collision — already supports dynamic tabs, just needed controllable state). Test count 1014 → 1051 (+37). |

---

## How to keep this doc fresh

1. **Each PROMPT closure**: update § 1 status, mark TODO closed in § 2, add new TODOs surfaced
2. **Each surprise/decision**: log in § 9 Decision queue if open, or document closure in update log
3. **Each Tier 1/2 item completed**: move from § 3-4 to "✅ done" with commit ref
4. **Strategy decisions**: update § 8 effort summary if scope changes
5. **Maintain calendar consistency** between § 1 PROMPT calendar and ship date in § 9 D1

End of MASTER_BACKLOG.md
