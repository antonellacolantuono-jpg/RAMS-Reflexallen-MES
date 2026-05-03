# PROMPT_7 — Registry detail/edit + ViewSwitcher + WO Back-Office + Schema migration + Recovery runtime

> **Phase**: F2.1 (post F1 close + post hotfix seed cleanup)
> **Effort target**: 3.5-4.5h Claude Code
> **Calendar**: 4-5 maggio 2026
> **Demo target**: Reflexallen S.p.A. — 18-22 maggio 2026
> **Baseline**: 744 tests cumulative (post hotfix `04c5de7`)
> **Test target**: floor 744 / ideal +20-25 = ~765-770

---

## 1. Context

F1 (Pneumatic First) chiusa al 100% con hotfix seed cleanup applicato. Lo stato è:

- Workflow seed pulito (nessun REC-* inline, recovery hidden in dedicated groups, Conformity Check binaria)
- D4.1 form Recovery Configuration nel workflow editor (session-only via node.data zustand)
- D4.2 RecoveryFlow inline panel + HMIScrapForm modal (hardcoded MAX=2, no DTO read, no pre-retry execution)
- 744 tests verdi, 11 anagrafiche con List view, alcune con view switcher parziale

**Gap principali da chiudere in PROMPT_7**:

1. **Registry detail/edit**: 11 anagrafiche hanno List view, ma le **detail/edit pages** sono incomplete o assenti. Process Engineer deve poter editare ricetta, postazione, equipment, skill, ecc.
2. **ViewSwitcher universale**: solo Workflows ha Flow view attiva. Equipment + BOM dovrebbero avere Flow view tramite CanvasView adapter. List/Card switching parziale.
3. **WO Back-Office detail page**: la pagina detail per Work Order (planner workspace) con 7-tab non è implementata. Planner deve poter aprire WO e vedere Overview / Workflow Snapshot / Materials / Execution / Quality / Genealogy / Activity.
4. **Workstation Detail Grid**: la postazione detail page non mostra le risorse associate (device + tool + materiali + skill + operatori abilitati) in formato grid.
5. **Schema migration `Step.data Json?`** (TODO-040 esteso parte 1): recoveryConfig + photo + actionType sono session-only nel workflow editor, NON persistiti in DB. Workflow editor che salva un step con recoveryConfig perde la config alla riapertura.
6. **HMI runtime read recoveryConfig + pre-retry execution loop** (TODO-040 esteso parte 2): RecoveryFlow inline panel hardcoded MAX=2 e ignora `step.recoveryConfig`. Click "Avvia tentativo di recupero" re-launches device cycle direttamente senza eseguire `preRetryStepIds`.

PROMPT_7 chiude tutti questi gap in 4 increment.

---

## 2. Goal

Dopo questo PROMPT:

### Workflow editor (apps/web)

- 11 registry anagrafiche con detail/edit pages funzionanti (CRUD complete: create, read, update, delete, restore from trash)
- ViewSwitcher attivo su tutte le 11 anagrafiche (List / Card / Flow dove applicabile per Equipment + BOM + Workflows)
- Workstation detail page con sezione "Risorse associate" come grid uniforme (device + tool + materiali + skill + operatori abilitati)
- WO Back-Office detail page accessibile da `/work-orders/[id]` con 7 tab: Overview / Workflow Snapshot / Materials / Execution / Quality / Genealogy / Activity

### Schema + Persistence

- `Step.data` come `Json?` column (Prisma migration applicata)
- Workflow editor save persiste `node.data.recoveryConfig` + `node.data.photoUrl` + `node.data.actionType` su `Step.data` JSON in DB
- Workflow editor open carica `Step.data` JSON e popola form correttamente
- DTO `WorkOrderStep` proietta `step.data` a HMI

### HMI runtime

- `RecoveryFlow` inline panel legge `step.data.recoveryConfig` da DTO
- `maxAttempts` dinamico (non più hardcoded 2)
- Click "Avvia tentativo di recupero" esegue sequenzialmente i `preRetryStepIds` come step manual (operatore conferma OK su ognuno) prima di re-launch device cycle
- Counter "Tentativo X / Y" con Y dinamico da config

### Tests

- Floor 744 mantenuto (no regressioni)
- Target ideal +20-25 = ~765-770 cumul
- Nuovi test: registry detail CRUD per ogni anagrafica + ViewSwitcher behaviors + WO BO 7-tab + schema migration regression + recoveryConfig DTO projection + RecoveryFlow runtime read + pre-retry execution loop

---

## 3. Implementation plan — 4 D-increments

### D1 — Schema migration + recoveryConfig persistence + DTO (~1h)

**Goal**: persistenza dei session-only fields recoveryConfig + photoUrl + actionType in DB + projection a HMI.

**Steps**:

1. **Prisma schema migration** (`packages/prisma/schema.prisma`):
   ```prisma
   model Step {
     // ... existing fields ...
     data       Json?    // Polymorphic step data (recoveryConfig, photoUrl, actionType, future extensions)
   }
   ```

2. **Migration name**: `prompt_7_step_data_json` (run `pnpm --filter @mes/prisma prisma migrate dev --name prompt_7_step_data_json`)

3. **Workflow editor save service** (`apps/web/src/services/workflow-save.service.ts` o simile):
   - Quando salva un workflow, mappa `node.data.recoveryConfig` + `node.data.photoUrl` + `node.data.actionType` in `Step.data` JSON
   - Schema Zod per validazione: `StepDataSchema = z.object({ recoveryConfig: RecoveryConfigSchema.optional(), photoUrl: z.string().optional(), actionType: z.string().optional() }).optional()`

4. **Workflow editor open service**:
   - Quando apre un workflow, carica `Step.data` JSON e popola `node.data` zustand store
   - Backward compat: se `Step.data` è null, usa default empty object

5. **DTO projection** (`apps/api/src/modules/work-orders/dto/work-order-step.dto.ts`):
   - Aggiungi field `data?: StepData` al DTO
   - Service include `step.data` nella query Prisma
   - Verify: `GET /api/work-orders/:id/steps` ora restituisce `step.data` per ogni step

6. **Tests D1**:
   - Workflow save/load roundtrip persistence (recoveryConfig stays after save+reopen)
   - DTO projection includes step.data
   - Migration up/down works

**Gates D1**:
- `pnpm --filter @mes/prisma prisma generate`
- `pnpm test` (744 + new tests)
- `pnpm build`

**Surprise budget D1**:
- S1 — Schema migration breaks existing data → ensure default null on existing rows, no data loss
- S2 — JSON serialization on SQLite quirks → use `String?` field with JSON serialize/parse helpers if needed (per DEV_MODE.md note "JSON String fields back to native Json type"), but try Json? first
- S3 — Existing workflow seed PNE_2 v1 has hardcoded recoveryConfig in workflow-v1.ts → after migration, re-seed should populate `Step.data` correctly. If not, STOP and ask.

**Commit**: `feat(prisma+workflow): persist Step.data JSON + recoveryConfig + photo + actionType (PROMPT_7 D1)`

---

### D2 — Registry detail/edit + ViewSwitcher universale (~1.5h)

**Goal**: 11 anagrafiche con detail/edit pages CRUD complete + ViewSwitcher attivo.

**Anagrafiche target**:

| # | Registry | Path | Detail | Card view | Flow view |
|---|---|---|---|---|---|
| 1 | Articoli (Items) | `/items` | ✓ existing list, missing detail+edit | ✓ | — |
| 2 | Distinte base (BOM) | `/bom` | missing | ✓ | ✓ multi-level tree |
| 3 | Gerarchia impianti (Equipment) | `/equipment` | partial | ✓ | ✓ ISA-95 5-level |
| 4 | Postazioni (Workstations) | `/workstations` | missing → **D3** scope | ✓ | — |
| 5 | Ricette (Recipes) | `/recipes` | missing | ✓ | — |
| 6 | Competenze (Skills) | `/skills` | missing | ✓ | — |
| 7 | Operatori (Operators) | `/operators` | missing | ✓ | — |
| 8 | Codici causa (Cause codes) | `/cause-codes` | missing | — | — |
| 9 | Punti attenzione (Attention points) | `/attention-points` | missing | ✓ | — |
| 10 | Attrezzatura (Equipment registry — different from Gerarchia) | `/tools` | missing | ✓ | — |
| 11 | Tipi imballo (Box Types) | `/box-types` | missing | ✓ | — |
| 12 | Imballi (Boxes) | `/boxes` | missing | ✓ | — |
| 13 | Regole auto-gen | `/auto-gen-rules` | ✓ existing read-only | — | — |
| 14 | Flussi di lavoro (Workflows) | `/workflows` | ✓ existing | ✓ | ✓ |

**Notes**:
- Some registries already have list/detail working from earlier work — **identify which during pre-flight** and focus on the gaps
- Detail pages reuse the **Split View Browser pattern** documented in design system (tree on left + detail on right, where applicable for Equipment / BOM)
- For non-tree registries, simple list + detail-row pattern (click row → drawer or full page detail)
- All detail pages have **Edit button** that opens a form (React Hook Form + Zod) for update + Save/Cancel
- All registry pages have **+ New button** that opens create form
- Soft delete on Delete action; restorable from `/cestino` (Trash) — already implemented for some, ensure consistency

**ViewSwitcher integration**:

- Use existing `<ViewSwitcher>` component (already implemented somewhere in the codebase per design system docs)
- Per registry, declare `availableViews` array based on the table above
- Persist selected view per registry in localStorage: `localStorage.setItem('rams.view.${registryId}', view)`
- For Card view: render entity card with entity image + name + key fields + status pill
- For Flow view: use `<CanvasView>` with adapter (`EquipmentHierarchyAdapter` for Equipment, `BOMAdapter` for BOM, `WorkflowAdapter` already exists for Workflows)

**Pre-flight check D2**:
- Map current state: which registries already have detail/edit, which are missing
- Identify which adapters (`EquipmentHierarchyAdapter`, `BOMAdapter`) exist already vs need to be created
- Confirm `<ViewSwitcher>` component is available and tested

**Tests D2**:
- For each registry without existing CRUD tests, add basic create/read/update/delete tests
- ViewSwitcher persistence test (localStorage roundtrip)
- CanvasView adapter tests for Equipment + BOM (if new)

**Gates D2**:
- `pnpm test` (target +10-15 new tests)
- `pnpm lint`
- `pnpm build`

**Surprise budget D2**:
- S4 — Some registries may already have full CRUD shipped from earlier work (PROMPT_2/3) → SCOPE REDUCTION welcome, skip those, focus on gaps
- S5 — `<ViewSwitcher>` component might not exist yet as universal reusable → if needed, create minimal version (segmented icon control) per design system
- S6 — Equipment registry has 5-level ISA-95 hierarchy → Flow view via dagre layout might require more work than expected. If too complex, ship List + Card only and DEFER Flow view to later (note in TODO).

**Commit**: `feat(registry): detail+edit pages + ViewSwitcher universal (PROMPT_7 D2)`

---

### D3 — Workstation Detail Grid + WO Back-Office detail 7-tab (~1h)

**Goal**: Workstation detail con risorse associate + WO BO planner workspace.

**Steps D3.1 — Workstation Detail Grid** (apps/web/src/app/(back-office)/workstations/[id]/page.tsx):

Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Header: WS-LEAK-01 / Banco Test Pneumatic / Edit        │
├─────────────────────────────────────────────────────────┤
│ Sezione: Informazioni base                              │
│   - Code, Name, Parent (Work Center), Status, Photo     │
├─────────────────────────────────────────────────────────┤
│ Sezione: Risorse associate                              │
│   ┌──────────────────────────────────────────────────┐  │
│   │ DEVICE                              STATUS       │  │
│   │ 🔧 DEV-LEAK-001 Banco prova         🟢 IDLE      │  │
│   │ 📷 DEV-CAMERA-001 Camera test       🟢 IDLE      │  │
│   ├──────────────────────────────────────────────────┤  │
│   │ TOOL                                STATUS       │  │
│   │ 🔨 TOOL-CRIMP-12-001                wear 12%     │  │
│   │ 🔨 TOOL-FIXTURE-12-001              wear 28%     │  │
│   ├──────────────────────────────────────────────────┤  │
│   │ MATERIALI TIPICI                                 │  │
│   │ 📦 LBL-PNE-001 Etichette                         │  │
│   │ 📦 TAPE-IDENT-001 Nastro id.                     │  │
│   ├──────────────────────────────────────────────────┤  │
│   │ SKILL RICHIESTE                                  │  │
│   │ 🎓 TEST · QC · IDENTIFICATION                    │  │
│   ├──────────────────────────────────────────────────┤  │
│   │ OPERATORI ABILITATI (3)                          │  │
│   │ 👤 Mario Rossi (badge 1234)                      │  │
│   │ 👤 Anna Verdi (badge 5678)                       │  │
│   │ 👤 Luca Bianchi (badge 9012)                     │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Implementation**:
- Backend endpoint `GET /api/v1/workstations/:id/resources` aggregate via include relations
- Frontend component `<WorkstationDetailGrid>` with 5 sections, each a card with table/list
- Skills derived from operator skills assignments + workstation requirements
- Operators abilitati: query operators with all required skills

**Steps D3.2 — WO Back-Office Detail 7-tab** (apps/web/src/app/(back-office)/work-orders/[id]/page.tsx):

7 tab structure (per design system pdf pag 7):

1. **Overview** (default):
   - 4 KPI cards: Target / Produced / Scrap / Rework with counters
   - Phase progress bars (6 phases with %)
   - Schedule info: planned start/end, actual start, released by/at
   - Assignment info: operator, work center, workflow version, type
   - Multi-level timer: WO total / Phase current / Current part

2. **Workflow Snapshot**:
   - Read-only view of the frozen workflow at WO release
   - Tree view phases > groups > steps
   - Click step → see config

3. **Materials**:
   - Reserved lots with quantities + remaining
   - BOM components consumed vs planned

4. **Execution**:
   - StepExecution history (count badge in tab title, e.g. "Execution 168")
   - Each step execution row: step name + operator + start/end + duration + outcome
   - Filter by status (pending / running / done / failed / scrapped)

5. **Quality**:
   - QC records (count badge, e.g. "Quality 4")
   - Sample test results
   - Defects logged
   - Scrap entries with cause codes + photos

6. **Genealogy**:
   - Allocated serials list
   - Click serial → see component-level genealogy (raw → semilavorato → finished good)
   - Lot movements

7. **Activity**:
   - Audit trail: timeline of events (released, paused, completed, etc.)
   - User + timestamp + event details

**Implementation**:
- Backend endpoints aggregate per tab: `/api/v1/work-orders/:id/overview`, `/execution`, `/quality`, `/genealogy`, `/activity`
- Frontend uses `<Tabs>` component (already in design system) with count badges
- Header: breadcrumb "Work Orders / WO-2026-0142" + status pill + priority pill + Edit + Audit log + Hold buttons

**Tests D3**:
- Workstation resource aggregation endpoint test
- WO BO 7-tab navigation + lazy loading per tab
- Quality tab shows scrap entries from D4 hotfix flow

**Gates D3**:
- `pnpm test` (target +5-8 new tests)
- `pnpm lint`
- `pnpm build`

**Surprise budget D3**:
- S7 — Some 7-tab data sources might not exist yet (e.g., Genealogy requires Serial/Lot relations not yet shipped) → SCOPE REDUCTION OK, ship Overview + Workflow Snapshot + Execution + Quality + Activity, defer Materials + Genealogy if not ready (note in TODO)
- S8 — Workstation "Operatori abilitati" requires skill matching logic → if not yet implemented, ship Skills list only, derive Operatori from a manual `assignedOperators[]` field if present, OR leave Operatori section "Coming soon" with skill list visible

**Commit**: `feat(workstations+work-orders): detail grid + back-office 7-tab page (PROMPT_7 D3)`

---

### D4 — HMI runtime read recoveryConfig + pre-retry execution + closure (~1h)

**Goal**: chiudere il gap rivelato dal pre-flight hotfix — `RecoveryFlow` inline panel deve leggere `step.data.recoveryConfig` e eseguire `preRetryStepIds`.

**Steps D4.1 — RecoveryFlow runtime read** (apps/hmi/src/components/RecoveryFlow.tsx):

Modify the existing component:
- Read `step.data?.recoveryConfig` from props
- If present and `enabled === true`: use `maxAttempts` from config (default 2 if missing)
- If absent: use hardcoded MAX=2 (backward compat for steps without config)
- Counter "Tentativo X / Y" uses dynamic Y from config

**Steps D4.2 — Pre-retry execution loop** (apps/hmi/src/app/wo/[id]/page.tsx + apps/hmi/src/components/RecoveryFlow.tsx):

When user clicks "Avvia tentativo di recupero":

1. Fetch the `preRetryStepIds` from `step.data.recoveryConfig.preRetryStepIds`
2. If empty array OR null: skip pre-retry, re-launch device cycle directly (current behavior)
3. If non-empty: execute pre-retry steps **sequentially** in HMI:
   - For each `preRetryStepId`:
     - Load step from workflow snapshot (via existing `useWorkOrderSteps` hook or similar)
     - Render step temporarily as **manual standalone step** in HMI (overlay or inline replacement of RecoveryFlow panel)
     - Wait for operator OK click
     - Continue to next pre-retry step
   - When all pre-retry done: re-launch device cycle (fire `RECOVER` event on state machine)
4. State machine handles RECOVER event same as before

**Implementation approach**:
- Add Zustand state slice or local React state for "pre-retry execution mode"
- During pre-retry mode, hide RecoveryFlow panel, show pre-retry step UI (reuse existing `<StepCard>` component for manual steps)
- After last pre-retry OK click, exit pre-retry mode, fire RECOVER

**Steps D4.3 — DTO + projection verification**:

Verify that `step.data` arrives correctly in HMI after seed re-run:
- After D1 schema migration, re-seed pneumatic
- Verify `GET /api/work-orders/:id/steps` for STEP-LEAK-003 returns:
  ```json
  {
    "code": "STEP-LEAK-003",
    "actionType": "device_run",
    "deviceCategory": "device_main",
    "deviceSerialNumber": "DEV-LEAK-001",
    "data": {
      "recoveryConfig": {
        "enabled": true,
        "maxAttempts": 2,
        "preRetryStepIds": ["STEP-LEAK-RECOVERY-CHECK", "STEP-LEAK-RECOVERY-CLEAN"]
      }
    }
  }
  ```
- If not, debug DTO + service include chain

**Steps D4.4 — Update seed v1 to populate recoveryConfig**:

After D1 schema migration, the seed must populate `Step.data` for STEP-LEAK-003 + STEP-CAM-002:

```typescript
// In packages/prisma/seed/pneumatic-data/workflow-v1.ts:
{
  code: 'STEP-LEAK-003',
  // ... existing fields ...
  data: {
    recoveryConfig: {
      enabled: true,
      maxAttempts: 2,
      preRetryStepIds: [<id resolved from STEP-LEAK-RECOVERY-CHECK>, <id resolved from STEP-LEAK-RECOVERY-CLEAN>]
    }
  }
}
```

Note: `preRetryStepIds` deve usare gli **ID** (UUID) degli step, non i codes. Quindi durante seed creation, dopo che gli step Recovery refs sono stati creati, raccogliere i loro IDs e popolare il `data` JSON.

**Steps D4.5 — Closure deliverables**:

- Update `STATUS.md` con summary PROMPT_7 chiusura
- Update `ROADMAP.md` mark F2.1 done → F2 progress 33%
- Update `TODO.md`:
  - TODO-040 closed (recoveryConfig persistence + DTO + runtime read + pre-retry execution complete)
  - TODO-038 closed (Workflow-meta editing topbar — verify if scope of registry detail edit)
  - TODO-039 closed (Design token migration — verify aligned with current changes)
  - TODO-041 closed (FaultCode split from CauseCode — verify in cause codes detail)

**Tests D4**:
- RecoveryFlow renders with dynamic maxAttempts from step.data.recoveryConfig
- RecoveryFlow falls back to MAX=2 hardcoded when step.data.recoveryConfig absent
- Pre-retry execution loop executes preRetryStepIds in sequence
- Pre-retry execution skips when array empty
- Seed v1 populates Step.data correctly for STEP-LEAK-003 + STEP-CAM-002
- DTO projection includes step.data on HMI work-order-step responses

**Gates D4**:
- `pnpm test` (target +5-8 new tests, total ~770)
- `pnpm lint`
- `pnpm build`

**Manual smoke gate D4** (before commit):
1. Kill all node processes + reset DB + reseed pneumatic
2. Boot all 3 apps
3. Browser HMI: navigate WO-2026-PNE-0042 to STEP-LEAK-003
4. Set Force FAIL on /demo for DEV-LEAK-001
5. Click "Avvia ciclo" → cycle FAIL → RecoveryFlow panel opens
6. Verify counter "Tentativo 1 / 2" with dynamic Y from config
7. Click "Avvia tentativo di recupero":
   - **NEW behavior**: pre-retry steps execute sequentially
   - Step 1: STEP-LEAK-RECOVERY-CHECK shown as manual standalone, click OK
   - Step 2: STEP-LEAK-RECOVERY-CLEAN shown, click OK
   - After last OK: device cycle re-launches
8. If FAIL again → Counter "Tentativo 2 / 2" → repeat or click "Scarta"
9. HMIScrapForm modal opens, complete + confirm
10. WO.qtyScrap incrementa correttamente

**Surprise budget D4**:
- S9 — Pre-retry execution UI complexity might exceed budget → SCOPE REDUCTION: implement basic execution (just sequence StepCard renders + OK clicks), skip advanced features (skip option, abort recovery from inside pre-retry, etc.)
- S10 — State machine might need new events for pre-retry start/done → if minor, add events; if complex, route via existing RECOVER event with prior local state tracking
- S11 — Seed must use step IDs not codes for preRetryStepIds → need to refactor seed to do post-creation pass that populates IDs. Acceptable surprise.

**Commit**: `feat(hmi+seed): runtime recoveryConfig + pre-retry execution + close TODO-040 (PROMPT_7 D4)`

---

## 4. Pre-flight checks (STOP conditions)

Before D1, verify:

1. **Branch state**: clean working tree on main, HEAD = `04c5de7` (hotfix). If different, STOP.

2. **Test baseline**: `pnpm test` returns 744 passing. If lower, STOP and report.

3. **Schema state**: Prisma schema has NOT yet `Step.data` field. If already exists, STOP — D1 was already done.

4. **D4 components verified shipped**:
   - `apps/hmi/src/components/RecoveryFlow.tsx` exists
   - `apps/hmi/src/components/HMIScrapForm.tsx` exists
   - `apps/web/.../AutomaticForm.tsx` has Recovery section with maxAttempts + preRetryStepIds
   - `apps/web/src/lib/step-validation-schemas.ts` has `recoveryConfig` schema

5. **Hotfix seed cleanup applied**:
   - Workflow seed `wf-pneumatic-air-680-v1` has 0 inline REC-* steps
   - 3 hidden recovery steps in dedicated groups (Leak Recovery refs / Camera Recovery refs)
   - STEP-CONFORMITY-001 group present
   - HMI page filter `name.match(/Recovery/i)` active

6. **Registries inventory**:
   - List which registries already have detail/edit pages working
   - List which need new work
   - Map adapters available for Flow view (EquipmentHierarchyAdapter, BOMAdapter, WorkflowAdapter)

If any STOP condition triggers, report state and wait.

---

## 5. Surprise budget (STOP conditions during implementation)

S1 — Schema migration breaks existing data
S2 — JSON serialization SQLite quirks (use String? + JSON helpers if Json? fails)
S3 — Existing seed PNE_2 v1 must populate Step.data after migration — may require seed code refactor
S4 — Some registries already have full CRUD → scope reduction welcome
S5 — `<ViewSwitcher>` may need creation if not universal yet
S6 — Equipment Flow view might exceed budget → defer if needed
S7 — WO BO 7-tab data sources incomplete → ship subset, document deferred
S8 — Workstation "Operatori abilitati" skill matching missing → ship Skills only
S9 — Pre-retry execution UI complexity → ship basic
S10 — State machine events for pre-retry → use RECOVER + local state
S11 — Seed needs step ID resolution post-creation → acceptable refactor

For each surprise: STOP + 1-3 line report + wait for user decision. Don't auto-decide scope reductions without explicit OK.

---

## 6. Closure deliverables

- 4 commits, conventional message format `(PROMPT_7 D{n})`
- All gates green at each D close (build + lint + test)
- Tests cumulative target ~765-770 (from 744 floor)
- TODO-040 closed (full recoveryConfig pattern: persistence + DTO + runtime + pre-retry execution)
- TODO-038, TODO-039, TODO-041 closed (verify scope alignment)
- STATUS.md PROMPT_7 closure summary
- ROADMAP.md F2.1 done → F2 progress 33%
- Manual smoke gate at D4 close: full WO journey including pre-retry execution flow
- Branch pushed, PR-ready
- Stop after D4 commit + push, wait for explicit kickoff for PROMPT_3c

---

## 7. Workflow rules (per Antonella)

- Pre-flight per § 4 first
- Each D-increment: implement → run gates → 1-3 line report → wait OK before commit
- Conventional commit message with `(PROMPT_7 D{n})` suffix
- Stop on surprise per § 5
- Manual smoke gate only at D4 close (D1-D3 use API/test verification)
- Don't auto-merge

---

## 8. Out of scope (explicitly deferred)

- ❌ PROMPT_8 Scheduling FULL (Planner Board drag-drop avanzato) → post-MVP
- ❌ PROMPT_PNE_5 (auto-print label + warning step + conditional Packaging group) → post-demo
- ❌ Plant Map SVG floor-plan editor → Workstation Grid replaces concept
- ❌ TODO-045 Resource Mobility (start location + allowed workflows) → post-demo
- ❌ i18n EN bilingual → post-MVP
- ❌ Real-time WebSocket cache invalidation (TODO-044) → defer
- ❌ Plant multi-tenant UI selector → post-MVP
- ❌ Audit Trail UI compliance FDA 21 CFR Part 11 → PROMPT_13

---

End of PROMPT_7 specification.
