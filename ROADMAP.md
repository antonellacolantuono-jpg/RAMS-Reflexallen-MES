# RAMS Reflexallen MES — ROADMAP v2 (Pneumatic First)

> **Version**: 2.0
> **Pivot date**: 2026-05-02
> **Replaces**: ROADMAP.md v1.x
> **Strategy**: deliver a complete, mockup-faithful Pneumatic Air vertical flow in code reality, then resume horizontal MES build.

---

## 1. Why the pivot

The original ROADMAP (v1.x) chained 9 PROMPTs in 3 horizontal phases (F1 foundation alignment → F2 operative tier 1 → F3 line-specific). Calendar landed MVP late June.

After audit on 2026-05-02 of mockup vs code (workflow editor: gated palette vs direct, vertical tree canvas vs phase-columns, single-tab inspector vs 3-tab) and customer alignment with Reflex Allen, the strategic priority shifted:

**New goal**: deliver one complete vertical flow (Pneumatic Air, line they already produce) in code reality, mockup-faithful, by **18-22 May 2026**, suitable for live customer demo.

The horizontal MES build (Andon, Plant Overview, all registry CRUD, Scheduling, Industrial Ops generales, CFRP, Safety Devices) resumes after the Pneumatic Air demo, in F2 and F3.

This pivot accepts **~3-4 week MVP slip** (mid-July → end of July / early August) in exchange for:
- A demonstrable customer-validated flow at end of May
- Mockup-fidelity validated in production code, not in Figma
- Real-world feedback before building line-specific F3 modules

---

## 2. Phase structure v2

### F1 — Pneumatic Air vertical (NEW)

5 PROMPTs sequential. Goal: configure → execute → demo Pneumatic Air end-to-end.

| # | PROMPT | Scope summary | Effort | Calendar |
|---|---|---|---|---|
| F1.1 | DS_LIFT (closed) | 14 patterns lifted to `@mes/ui` (foundation, view, op-table, card, detail, plant-map, canvas) + showcase | 18h actual (closed 2026-05-02) | done |
| F1.2 | PROMPT_3d (closed) | Palette ungated, drag-drop step-on-group, canvas phase-columns horizontal, inspector 3-tab Properties/Metadata/Audit, AddPhase/AddGroup/AddStep/Validate dialogs, Visual/Parallel toggle, WorkflowTopBar | ~16h actual (closed 2026-05-02) | done |
| F1.3 | PROMPT_PNE_1 (closed) | Step configurator with 6 tabs Materials/Tools/Devices/Skills/Recipes/Attention Points, multi-select + search, Recipe-Device coupling, 8 Action Config forms, Save flow wired | ~10h actual (closed 2026-05-02) | done |
| F1.4 | PROMPT_PNE_2 (closed) | Prisma seed: 1 area / 4 WCs / 4 WSs / 3 devices + 5 items + 1 BoxType + 3 recipes + 4 skills + 2 operators + 6 cause codes + 10 fault codes (CauseCode workaround S1) + 3 APs + 2 workflows ("v1 Demo" pre-configured 4 phases/6 groups/**34 steps** incl. inline recovery groups B2+C2 + "v0 Empty" scaffold) + 1 WO released with WorkflowSnapshot. Closes TODO-031. Opens TODO-041, TODO-042. | ~6h actual (closed 2026-05-02) | done |
| F1.5 | **PROMPT_PNE_3** Mock device simulator | DEV-LEAK-001 service mock (45s cycle, RCP-LEAK-PNE-12-001 v2, threshold 0.5 mbar/min, demo toggle PASS/FAIL/MARGINAL). DEV-CAMERA-001 (8s, 4 ROIs). WebSocket events for live HMI updates | 8-12h | 12-13 May |
| F1.6 | **PROMPT_PNE_4** HMI specialized + label/scrap fidelity | HMI Leak Test split layout (top device + bottom 3 parallel slots side-by-side), HMI Camera Test, recovery flow UI fidelity, scrap UI fidelity (cause code + photo mock + counters), label print mock (toast + SVG preview) | 12-16h | 14-17 May |
| | **F1 totals** | | **48-70h** | **5-17 May** |

**F1 demo target**: 18-20 May 2026 (Reflex Allen Pneumatic Air vertical demo, in code reality, mockup-faithful).

### F2 — Horizontal MES shell (DEFERRED from original F1)

Resume horizontal build after Pneumatic Air demo.

| # | PROMPT | Scope summary | Effort | Calendar (post-demo) |
|---|---|---|---|---|
| F2.1 | PROMPT_6 | Andon dashboard (KpiHero giants + WCCard grid + LiveAlert feed) + Plant Overview (PlantMap with workstations + zones + click-through to Andon) | 12-16h | 21-26 May |
| F2.2 | PROMPT_7 | 11 registry detail/edit/new pages (operators, equipment, tools, recipes, skills, cause-codes, attention-points, BOM, box-types, boxes, devices) + WO List back-office + WO Detail back-office (DetailHeader + 7-tab body) | 14-20h | 27 May - 3 June |
| F2.3 | PROMPT_3c | Workflow editor Live Preview State-Driven (11 states interactive on selected step) | 6-10h | 4-5 June |
| F2.4 | i18n setup | next-intl routing IT/EN, locale switcher, all hardcoded strings extracted (estimate covers F1 surface + new F2 pages; F3 covered by per-PROMPT extraction) | 8-12h optional | 6-8 June (skippable) |
| | **F2 totals** | | **40-58h** | **21 May - 8 June** |

### F3 — Operative Tier 1 + Line-specific (REORDERED)

| # | PROMPT | Scope summary | Effort | Calendar |
|---|---|---|---|---|
| F3.1 | PROMPT_8 | Scheduling FULL: WO Assignment 5-states + Shift + ShiftHandover + Skills coverage + Planner Board + Dispatch List | 24-32h | 9-16 June |
| F3.2 | PROMPT_9 | Equipment Mgmt rich + WO Detail rich: Equipment 8-states XState + MaintenanceOrder + ToolWear + 7-tab equipment detail + WO Detail timer multi-level + reservations | 28-36h | 17-25 June |
| F3.3 | PROMPT_10 | Industrial Ops: Multi-output cycles + Sample tracking + FAI block + Quality Hold + Continuous production + WIP container + Subassembly nested BOM | 24-32h | 26 June - 4 July |
| F3.4 | PROMPT_11 | CFRP Module: Mold + Prepreg roll out-time + CureCycleRun telemetry + NDT result + vacuum test | 26-32h | 5-12 July |
| F3.5 | PROMPT_12 | Safety Devices Module: ReflectanceTest ECE-R104 + Homologation cert + AgingTest + Lamination | 22-28h | 13-19 July |
| F3.6 | PROMPT_13 | Audit/Genealogy/Skills Matrix: Audit Trail UI filter + Genealogy bidirectional graph + Skills Matrix operator × skill | 14-18h | 20-24 July |
| | **F3 totals** | | **138-178h** | **9 June - 24 July** |

---

## 3. Total trajectory

| Phase | Effort | Calendar | Outcome |
|---|---|---|---|
| F1 | 48-70h (excl. closed DS_LIFT) | 5-17 May | Pneumatic Air vertical demo-ready |
| F2 | 40-58h | 21 May - 8 June | Horizontal shell aligned, demo intermedia |
| F3 | 138-178h | 9 June - 24 July | MVP complete |
| **Total residual** | **226-306h** | **5 May - 24 July** | **Ship 24-31 July 2026** |

Slip vs original ROADMAP v1: ~3-4 weeks. Driven by mockup fidelity standard (decided in conversation 2026-05-02) and Pneumatic vertical priority.

---

## 4. Decisions taken at pivot

Recorded for traceability.

### 4.1 Mockup fidelity standard

**Decision**: Workflow editor (F1.2) and HMI Leak Test specialized (F1.6) must be mockup-faithful (non-negotiable for customer-facing demo). Other surfaces are mockup-aligned in spirit but not pixel-perfect; polish gradually post-MVP.

**Rationale**: faithfulness on customer-facing screens drives trust at demo; pixel-perfect on internal screens (registry detail, audit log viewer) is polish, not value.

### 4.2 Double seed Pneumatic Air

**Decision**: F1.4 (PROMPT_PNE_2) seeds two workflows:
- "Pneumatic Air M12 680mm v1 (Demo)" — pre-configured 4 phases, 4 groups, 19 steps with all resources wired
- "Pneumatic Air M12 680mm v0 (Empty)" — only resources seeded (item, recipes, devices, materials, fault codes), workflow blank for user to construct manually as UX validation

**Rationale**: v1 fast demo path; v0 lets Antonella validate workflow editor UX on a real production case.

### 4.3 Label print mock for MVP

**Decision**: F1.6 implements label print as a UX mock (toast + floating SVG preview 3 sec), no physical printer integration. ZPL + network printer protocol deferred to V2 (post-MVP).

**Rationale**: MVP scope is "demo flow end-to-end", not "physical printer integration with customer hardware". V2 work for production deployment.

### 4.4 Label content language (default IT)

**Decision**: Mock label content in Italian (default for Reflex Allen). Bilingual IT/EN deferred to F2.4 (i18n setup).

### 4.5 Workflow editor backward-compat

**Decision**: PROMPT_3d refactor must preserve existing test workflows (e.g., WF-TEST-001 already in DB). Migration if needed: convert legacy palette gating to new direct-palette state without data loss.

### 4.6 Operational practice — `.next` cache

**Decision**: After every PROMPT merge that touches `apps/web` or `apps/hmi` Next.js pages, contributor must clear `.next` cache before next `pnpm dev`:

```powershell
Remove-Item -Recurse -Force apps\web\.next, apps\hmi\.next -ErrorAction SilentlyContinue
pnpm dev
```

**Rationale**: Next.js dev mode incrementally caches module resolution; large rewrites can produce stale "Module not found" errors that build cleans don't reproduce. Standard practice prevents wasted diagnostic time.

### 4.7 Operational practice — `pnpm install` after PROMPT merge

**Decision**: After every PROMPT merge that adds new dependencies to any `apps/*/package.json` or `packages/*/package.json`, contributor must run `pnpm install` locally before `pnpm dev`. Lockfile being correct on the branch does NOT mean local node_modules is updated.

**Rationale**: PROMPTs run in Claude Code's environment where `pnpm install` is implicit; locally it must be re-run. Documented to prevent recurrence of D6 lucide-react diagnostic episode.

### 4.8 Smoke test pre-merge

**Decision**: After every major PROMPT closes, contributor (Antonella) performs visual smoke test on key affected pages before merging the branch to main:
- Verify no Build Error red banner
- Verify expected UI elements render (e.g., tabs, columns, buttons)
- Verify console has no obvious errors (when accessible)

If smoke fails, do NOT merge. Reopen the branch and fix before merging.

---

## 5. Open TODOs at pivot date

Carried forward from PROMPT_DS_LIFT closure.

- ~~**TODO-031**~~ — ✅ closed by PROMPT_PNE_2 D4 (2026-05-02). Added `@mes/prisma#generate` task with `cache: false` to turbo.json and made it a `dependsOn` for the build pipeline. Validated against simulated clean state (.prisma client moved → pnpm build → regenerated transparently).
- **TODO-032** — Audit `useToast()` callsites in `apps/web` and `apps/hmi`. Toast moved from no-op stub to full impl in DS_LIFT D1; existing callsites now produce visible toasts. Verify no UX regression. Owner: opportunistic, Antonella spot-check during F1.
- **TODO-033** — Adapter API audit-log row → `AuditTimelineEntry` shape. Both `AuditEntry` (legacy ActivityFeed) and `AuditTimelineEntry` (new) coexist. AuditTab in PROMPT_3d D4 wires a stub returning []. Full adapter owner: PROMPT_7 / F2.2.

Opened during PROMPT_3d (F1.2):

- ~~**TODO-034**~~ — ✅ closed by PROMPT_PNE_1 (2026-05-02). Add Step full configurator (6 resource tabs) + Action Config (8 forms) + save flow shipped across D1-D4.
- **TODO-035** — Parallel view editing (currently read-only since D6). Owner: F2.
- **TODO-036** — Decision-step `onOk`/`onNok` schema fields missing on Step model. Schema migration required. Owner: F2 (or earlier if PROMPT_PNE_2 seeds decision branches for recovery).
- **TODO-037** — `@mes/ui` CanvasEdge / React Flow `EdgeProps` API asymmetry. Recommend Option B (document architectural decision) for MVP. Owner: F2.
- **TODO-038** — Workflow-root metadata editing (`tags` + `defaultWorkCenters`). MetadataTab in D4 is read-only on canvas-node selection; workflow-level fields belong in the topbar / page header. Owner: PROMPT_7 / F2.2.
- **TODO-039** — Design token migration. `bg-primary-*` / `bg-success-*` / `text-primary-*` unmapped in apps/web tailwind config — pre-existing pages render unstyled buttons. PROMPT_3d D5 hotfix only fixed the 4 dialogs. Recommend Option A (extend tailwind config). Owner: PROMPT_7 / F2.2.

Opened during PROMPT_PNE_1 (F1.3):
- **TODO-040** — AddStepDialog multi-select arrays (`materialIds`/`attentionPointIds`) + per-form Action Config blob session-only / lossy on reload. Schema migration required (`Step.config Json?` + M:N tables). Owner: F2 / PROMPT_7.

Opened during PROMPT_PNE_2 (F1.4):
- **TODO-041** — Split FaultCode from CauseCode (currently colocated under category='recovery_fault'). Schema migration required. Owner: F2 / PROMPT_7 default; pull earlier if PROMPT_PNE_4 HMI Recovery dropdown design needs first-class FaultCode entity.
- **TODO-042** — PROMPT_PNE_2 § 1 summary said "19 steps" but enumeration totals 34 step rows. Documentation hygiene only — no code action.

---

## 6. Demo guidance

When Pneumatic Air is ready (target 18-20 May), the demo script is:

1. Open `/workflows/wf-pneumatic-air-680-v1` (the seedeed v1 Demo) in workflow editor — show 4 phases, 19 steps, resources wired.
2. (Optional) Open `/workflows/wf-pneumatic-air-680-v0` (Empty) and demonstrate live UX of building a phase + group + step from palette ungated, drag-drop step kind onto group.
3. Switch to HMI tablet view, login operator (mock), select WS-LEAK-01 workstation.
4. Pick WO-2026-PNE-0042 from dispatch.
5. BOM check screen → confirm.
6. Through Final Assembly steps (skip with "Fast forward" debug button to piece 23).
7. Leak Test screen → operator clicks Start on device + 3 parallel slots → demonstrate concurrent execution.
8. Switch demo toggle → simulate FAIL → enter recovery flow → fault code "Hose connection loose" → re-test PASS → continue.
9. Camera Test screen → simpler 8s cycle.
10. Packaging screen → scan tubes → label print mock toast → seal box.
11. WO completion summary screen.

Total demo duration: 15-25 minutes guided.

What to communicate to Reflex Allen before demo:
- "Andon dashboard, Plant Overview, registry detail editors are in next sprint (F2)."
- "Physical printer integration is V2."
- "All values shown (leak rate, ROI scores, OEE) are simulated by mock device service for demo; real device integration follows customer device specs."

---

## 7. Change log

| Date | Change | Author |
|---|---|---|
| 2026-04-27 | ROADMAP v1.x initial (9 PROMPTs in 3 horizontal phases) | Claude Code + Antonella |
| 2026-05-02 | ROADMAP v2 pivot to Pneumatic First (5 new F1 PROMPTs, F2/F3 reordered) | this document |
| 2026-05-02 | F1.4 PROMPT_PNE_2 closed (4 D increments, +18 tests cumul 655, opens TODO-041/042 closes TODO-031) | this document |

---

**Owner**: Antonella Colantuono
**Project**: RAMS Reflexallen MES
**Repo**: github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
