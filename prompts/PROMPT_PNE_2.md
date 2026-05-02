# PROMPT_PNE_2 — Pneumatic Air seed (double workflow + WO)

> **Version**: 1.0
> **Author**: Antonella Colantuono (via Claude chat)
> **Date**: 2026-05-02
> **Branch base**: `main` (post PROMPT_PNE_1 merge)
> **Estimated effort**: 6-10h (across 4 increments)
> **Test budget**: floor +12, ideal +16
> **Mockup fidelity**: domain accuracy NON-NEGOTIABLE (data must match Reflex Allen production reality)

---

## 1. Goal

Create a Prisma seed script that populates the development database with Pneumatic Air production data for a tube product `PNE-TUBE-12-680` (12mm × 680mm), so that demo path is one-command-ready:

```bash
pnpm --filter @mes/prisma seed:pneumatic
```

After running the seed, the system has:

- **Item** PNE-TUBE-12-680 + raccordi + materials + box types
- **Recipes** RCP-LEAK-PNE-12-001 v2 + RCP-CRIMP-12-001 + RCP-CAMERA-PNE-001 v1
- **Devices** DEV-LEAK-001 (ATEQ Premier i style), DEV-CRIMP-001 (servo-electric), DEV-CAMERA-001 (vision system)
- **Workstations + Work Centers + Plant hierarchy** for the Pneumatic line
- **Operators** Mario Rossi (badge 1234, password 1234, skills ASSY+TEST+QC), Anna Verdi (badge 5678, skills TEST+QC)
- **Skills** ASSY, TEST, QC, IDENTIFICATION
- **Cause Codes** for scrap (material_defect, process_error, tool_wear, crimp_leak, camera_calibration, other)
- **Fault Codes** for leak recovery (hose_loose, sealing_contaminated, real_defect, crimp_leak, other) and camera recovery (misalignment, lighting, positioning, real_defect, calibration_drift)
- **Attention Points** AP-CRIMP-FORCE, AP-LEAK-PRESSURE, AP-LABEL-LEGIBILITY
- **Two workflows**:
  - `wf-pneumatic-air-680-v1` "Pneumatic Air M12 680mm v1 (Demo)" — pre-configured, 4 phases / 4 groups / 19 steps, status `Active`, ready for WO release
  - `wf-pneumatic-air-680-v0` "Pneumatic Air M12 680mm v0 (Empty)" — same resources but workflow body empty, status `Draft`, for manual UX-validation construction
- **One Work Order** WO-2026-PNE-0042 with target qty 100 + buffer 5 = 105, item PNE-TUBE-12-680, workflow v1, status `released` (ready to start)

---

## 2. Domain reference (must respect)

This seed must reflect the production line as documented in:

- `WORKFLOW_PNEUMATIC_AIR.md` (high-level)
- `WORKFLOW_PNEUMATIC_AIR_DETAILED.md` (per-step with parallel/recovery)
- `MOCK_DATA_PNEUMATIC_AIR.md` (existing mock data definitions, especially § 14.7 leaktest steps with parallel)

Critical fidelity points (see those docs):
- Phase Final Assembly has 8 steps including 2 crimp steps (end A + end B).
- Phase Leak Test is `device_execution` group with `supportsParallel: true` and `supportsRecovery: true`. Device main step `STEP-LEAK-003 RUN_LEAK_TEST` has 3 parallel children (apply label, prepare next, fill QC checklist for previous), parallelStepsBufferSec: 5.
- Recovery flow `STEP-LEAK-RECOVERY-FLOW` has max 3 attempts, then forced scrap.
- Tube product spec: 12mm × 680mm (this is a SHORTER demo product vs the 2000mm in WORKFLOW_PNEUMATIC_AIR.md spec; chosen for demo because it's faster to handle).
- Customer reference: Iveco/Volvo (truck braking system).
- Working pressure: 10 bar; burst > 30 bar; ECE compliance ISO 7628 / DIN 73378.

---

## 3. What is in scope

### 3.1 Seed script

New file: `packages/prisma/seed/pneumatic.ts` (or `seed-pneumatic.ts` — match existing seed file naming convention).

Idempotent: re-running the seed must not duplicate records (use `upsert` on unique codes, or check existence before insert).

Wired to `package.json`:
```json
{
  "scripts": {
    "seed:pneumatic": "ts-node seed/pneumatic.ts"
  }
}
```

### 3.2 Data created

#### Plant + Hierarchy
```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Pneumatic Air
    ├── WC-ASSY-PNE-01 (Banco Assemblaggio)
    │   └── WS-ASSY-01 (Banco assemblaggio)
    │       └── DEV-CRIMP-001 (Crimpatrice servo-elettrica)
    ├── WC-LEAK-PNE-01 (Test funzionali Leak)
    │   └── WS-LEAK-01 (Banco leak test)
    │       └── DEV-LEAK-001 (Leak Tester ATEQ Premier i style)
    ├── WC-CAMERA-PNE-01 (Test funzionali Camera)
    │   └── WS-CAMERA-01 (Banco camera test)
    │       └── DEV-CAMERA-001 (Camera vision system)
    └── WC-PACK-PNE-01 (Imballaggio)
        └── WS-PACK-01 (Banco imballaggio)
```

#### Items
- PNE-TUBE-12-680 (finished good, raw tube assembled)
- RACC-PNE-12-A (raccordo end A, component)
- RACC-PNE-12-B (raccordo end B, component)
- LBL-PNE-001 (label, consumable)
- TAPE-IDENT-001 (identification tape, consumable)
- BTYPE-PLT-RFA-001 (returnable Reflexallen pallet, box type)

#### Recipes
- RCP-LEAK-PNE-12-001 v2 (deviceCompat: DEV-LEAK-001, cycleTime: 45s, threshold: 0.5 mbar/min PASS, 0.5-1.0 MARGINAL, > 1.0 FAIL, pressure target 6.0 bar)
- RCP-CRIMP-12-001 (deviceCompat: DEV-CRIMP-001, force target: 25 kN ± 1, attentionPoints: [AP-CRIMP-FORCE])
- RCP-CAMERA-PNE-001 v1 (deviceCompat: DEV-CAMERA-001, cycleTime: 8s, 4 ROIs each with similarity threshold ≥ 95%)

#### Skills
- ASSY (Assemblaggio, level required for assembly steps)
- TEST (Testing, level required for leak/camera tests)
- QC (Quality Control, for inspection/rework)
- IDENTIFICATION (for label/tape/scan steps)

#### Operators
- Mario Rossi (badge: 1234, PIN: 1234, skills: [ASSY, TEST, QC, IDENTIFICATION])
- Anna Verdi (badge: 5678, PIN: 5678, skills: [TEST, QC])

#### Cause Codes
- material_defect (Difetto materiale, severity: high)
- process_error (Errore processo, severity: medium)
- tool_wear (Usura utensile, severity: medium)
- crimp_leak (Difetto crimpatura, severity: high)
- camera_calibration (Calibrazione camera, severity: medium)
- other (Altro, severity: variable)

#### Fault Codes
For Leak recovery:
- LK-HOSE-LOOSE (Connessione tubo allentata, suggested: re-tighten)
- LK-SEAL-CONTAM (Superficie sigillante contaminata, suggested: clean)
- LK-REAL-DEFECT (Difetto reale del tubo — porosità, suggested: scrap)
- LK-CRIMP-LEAK (Perdita su crimpatura, suggested: scrap)
- LK-OTHER (Altro)

For Camera recovery:
- CM-MISALIGN (Camera disallineata)
- CM-LIGHTING (Problema illuminazione)
- CM-POSITIONING (Tubo mal posizionato)
- CM-REAL-DEFECT (Difetto conformità reale, suggested: scrap)
- CM-CALIBRATION (Drift calibrazione)

#### Attention Points
- AP-CRIMP-FORCE (severity: high, category: process, message: "Verificare forza crimpatura entro tolleranza ±1kN")
- AP-LEAK-PRESSURE (severity: high, category: safety, message: "Disinnestare aria compressa prima di scollegare fixture")
- AP-LABEL-LEGIBILITY (severity: medium, category: quality, message: "Verificare che marcatura sia leggibile prima di applicare etichetta")

#### Workflow v1 — Pneumatic Air M12 680mm v1 (Demo)

Code: `wf-pneumatic-air-680-v1`
Status: `Active` (published, ready to release WO)
Item: PNE-TUBE-12-680
Default work centers: WC-ASSY-PNE-01, WC-LEAK-PNE-01, WC-CAMERA-PNE-01, WC-PACK-PNE-01

**Phase 1 — Assemblaggio Finale (production, cycle-based)**

Group A1 — Tube Preparation (assembly, no parallel/recovery)
- 1.1 [Manual] Pick tube — duration 5s
- 1.2 [Manual] Visual check tube condition — duration 4s
- 1.3 [Guided] Mount raccordo end A (RACC-PNE-12-A) — duration 8s, tool TW-014 (insert if exists in seed; else skip tool)
- 1.4 [Automatic] Crimp end A — device DEV-CRIMP-001, recipe RCP-CRIMP-12-001, force 25kN ±1, AP-CRIMP-FORCE, duration 8s
- 1.5 [Manual] Visual check crimp A — duration 5s
- 1.6 [Guided] Mount raccordo end B (RACC-PNE-12-B) — duration 8s
- 1.7 [Automatic] Crimp end B — same as 1.4
- 1.8 [Manual] Final visual check — duration 5s

**Phase 2 — Leak Test (quality_control, cycle-based)**

Group B1 — Leak Test Execution (device_execution, supportsParallel: true, supportsRecovery: true)

Pre-steps (sequential):
- 2.1 [Manual] Position tube on fixture — duration 8s, AP-LEAK-PRESSURE
- 2.2 [Manual] Connect pneumatic hoses — duration 10s

Device main step:
- 2.3 [Automatic / device_execution main] Run leak test cycle
  - device: DEV-LEAK-001
  - recipe: RCP-LEAK-PNE-12-001 v2
  - cycleTime: 45s
  - parallelStepsBufferSec: 5
  - supportsParallel: true
  - onPass: continue
  - onMarginal: operator decision (re-test or escalate)
  - onFail: trigger STEP-LEAK-RECOVERY-FLOW

Parallel steps (during 45s):
- 2.4 [Parallel] Apply label LBL-PNE-001 on previous tube — duration 12s, partRef: previous
- 2.5 [Parallel] Apply identification tape TAPE-IDENT-001 on previous tube — duration 10s, partRef: previous
- 2.6 [Parallel] Prepare next tube on staging — duration 20s, partRef: next

Post-steps (sequential):
- 2.7 [Decision] Read leak result
  - branches: PASS → 2.8, MARGINAL → 2.7.b operator decision, FAIL → STEP-LEAK-RECOVERY
- 2.8 [Manual] Disconnect hoses — duration 5s
- 2.9 [Manual] Remove tube to passed tray — duration 3s

**Phase 3 — Camera Test (quality_control, cycle-based)**

Group C1 — Optical Conformity Check

- 3.1 [Manual] Position tube in camera fixture — duration 6s
- 3.2 [Automatic / device_execution main] Camera test cycle
  - device: DEV-CAMERA-001
  - recipe: RCP-CAMERA-PNE-001 v1
  - cycleTime: 8s
  - 4 ROIs: raccordo A, raccordo B, label position, tape position; threshold ≥ 95%
  - onPass: continue
  - onFail: STEP-CAMERA-RECOVERY
- 3.3 [Decision] Read camera result
  - branches: PASS → 3.4, FAIL → STEP-CAMERA-RECOVERY
- 3.4 [Manual] Remove tube — duration 3s

**Phase 4 — Imballaggio (outbound, NOT cycle-based — sub-loops by box capacity)**

Group D1 — Box Management (packaging, AUTO-GEN tag)

- 4.1 [Manual] Select empty box BTYPE-PLT-RFA-001 — duration 8s
- 4.2 [Guided] Pack tube in box (scan serial) — duration 6s, repeat until 50 pieces
- 4.3 [Manual] Validate box capacity reached — duration 4s
- 4.4 [Manual] Seal box — duration 10s
- 4.5 [Automatic] Print box label and apply — duration 12s, AP-LABEL-LEGIBILITY

**Recovery sub-flows (separate workflow entries)**:

`wf-leak-recovery-pne` "Recovery: Leak Test Failure" (Active)
- Stage 1: Diagnosis — Select fault code from 5 LK-* options
- Stage 2: First retry — Apply correction per fault, re-test
- Stage 3: Second retry — Alternative correction, re-test
- Stage 4: Forced Scrap — cause code mandatory, photo upload (mock), notify QC
- Max attempts: 3

`wf-camera-recovery-pne` "Recovery: Camera Test Failure" (Active)
- Same pattern, max 2 attempts, with CM-* fault codes

#### Workflow v0 — Pneumatic Air M12 680mm v0 (Empty)

Code: `wf-pneumatic-air-680-v0`
Status: `Draft`
Item: PNE-TUBE-12-680
Default work centers: same 4 as v1
**Body**: empty (no phases, no groups, no steps)
Purpose: to be filled manually by user (Antonella) during UX validation of workflow editor.

#### Work Order

WO-2026-PNE-0042
- itemId: PNE-TUBE-12-680
- workflowId: wf-pneumatic-air-680-v1 (snapshotted on release)
- qtyTarget: 100
- qtyBuffer: 5
- qtyRemaining: 105
- priority: high (will render orange in HMI dispatch)
- status: `released` (assigned to WS-LEAK-01 + WS-ASSY-01 + WS-CAMERA-01 + WS-PACK-01)
- assignedOperators: [Mario Rossi]
- shift: A 06:00-14:00
- expectedStart: today
- expectedDuration: ~3.5 hours

---

## 4. What stays unchanged

- Database schema (no migrations)
- Existing seed scripts (don't touch them; this is a NEW seed script alongside)
- API endpoints (no changes; new data is just data)

---

## 5. Pre-flight checks

```bash
git status                          # clean main, post PROMPT_PNE_1 merge
pnpm test --run 2>&1 | tail -5      # cumul ~632

# Verify Prisma schema has all entities expected
grep -E "model (Item|Recipe|Equipment|Operator|Skill|Workflow|WorkOrder|FaultCode|CauseCode|AttentionPoint)" packages/prisma/schema.prisma
# expect: all listed models exist

# Check existing seed scripts location
ls packages/prisma/seed/
```

If any model is missing in schema, **stop and report**. Schema changes are out of scope for PROMPT_PNE_2.

---

## 6. Increments

### D1 — Hierarchy + Items + Recipes + Devices + Skills + Operators

**Scope**: foundational entities. No workflows yet.

**Files**:
- `packages/prisma/seed/pneumatic.ts` (new)
- `packages/prisma/seed/pneumatic-data/items.ts` (new — data array for items)
- `packages/prisma/seed/pneumatic-data/recipes.ts` (new)
- `packages/prisma/seed/pneumatic-data/equipment.ts` (new — workstations + devices)
- `packages/prisma/seed/pneumatic-data/operators-skills.ts` (new)

**Tasks**:
- Top-level `seed/pneumatic.ts` orchestrates: connect Prisma → upsert site/area/work centers/workstations/devices → upsert items → upsert recipes (link to devices) → upsert skills → upsert operators (link skills) → log progress.
- Each upsert by unique code field. Idempotent.

**Tests** (target +4):
- Seed runs without errors on a fresh DB (1 integration test in `@mes/prisma`)
- Seed runs idempotently (2nd run doesn't error, doesn't duplicate) (1)
- After seed, items query returns expected codes (1)
- After seed, devices query returns expected with recipe relations (1)

**Gates D1**:
- `pnpm --filter @mes/prisma seed:pneumatic` runs successfully on fresh DB
- type-check + build + lint clean
- Cumul: ~632 → ~636

**Commit**: `feat(prisma-seed): pneumatic foundation entities (items, recipes, equipment, operators) (PROMPT_PNE_2 D1)`

### D2 — Cause codes + Fault codes + Attention points + WorkOrder

**Scope**: domain auxiliary entities + the WO that will be runnable in HMI.

**Files**:
- `packages/prisma/seed/pneumatic-data/cause-codes.ts` (new)
- `packages/prisma/seed/pneumatic-data/fault-codes.ts` (new — link to recovery sub-flow categories)
- `packages/prisma/seed/pneumatic-data/attention-points.ts` (new)
- `packages/prisma/seed/pneumatic-data/work-orders.ts` (new — WO-2026-PNE-0042)

**Tasks**:
- Upsert all listed entities.
- WO is in `released` status — verify the existing release flow doesn't fail when reading workflow snapshot (snapshot will be added in D3 when the workflow exists; for now WO can be in `pending` and will transition to `released` after D3).

**Tests** (target +3):
- Cause codes seeded with correct severity (1)
- Fault codes linked to recovery category (1)
- WO seeded with correct counters (1)

**Gates D2**:
- type-check + build + lint clean
- Cumul: ~636 → ~639

**Commit**: `feat(prisma-seed): pneumatic cause codes + fault codes + attention points + WO (PROMPT_PNE_2 D2)`

### D3 — Workflow v1 (Demo, fully populated)

**Scope**: the showcase workflow, ready to demo.

**Files**:
- `packages/prisma/seed/pneumatic-data/workflow-v1.ts` (new — the 4-phase / 4-group / 19-step workflow)
- `packages/prisma/seed/pneumatic-data/recovery-workflows.ts` (new — leak recovery + camera recovery sub-flows)

**Tasks**:
- Create workflow `wf-pneumatic-air-680-v1` with status `Active` (published; this requires creating a `WorkflowVersion` record with version 1, status `Active`, snapshot of all phases/groups/steps).
- Create the 2 recovery sub-flows.
- Wire decision step branches: `step.onNok` references `wf-leak-recovery-pne`, etc.
- Activate WO-2026-PNE-0042 status to `released` (transition from `pending` set in D2) — this triggers workflow snapshot copy into `workorder_workflow_snapshots`.

**Tests** (target +3):
- Workflow v1 has 4 phases, 4 groups, 19 steps (1)
- Decision step in phase 2 has correct onOk/onNok branches (1)
- WO-2026-PNE-0042 status is `released` with workflow snapshot present (1)

**Gates D3**:
- `pnpm --filter @mes/prisma seed:pneumatic` runs full seed including workflows
- Manually verify in Prisma Studio (or via API): workflow has correct structure
- Cumul: ~639 → ~642

**Commit**: `feat(prisma-seed): pneumatic workflow v1 + recovery sub-flows + WO release (PROMPT_PNE_2 D3)`

### D4 — Workflow v0 (Empty) + tests + STATUS update

**Scope**: empty workflow scaffold + close PROMPT.

**Files**:
- `packages/prisma/seed/pneumatic-data/workflow-v0-empty.ts` (new — workflow shell with no phases)
- `STATUS.md` (closure section)

**Tasks**:
- Create workflow `wf-pneumatic-air-680-v0` with status `Draft`, item PNE-TUBE-12-680, default work centers same as v1, but no phases/groups/steps.
- Verify in workflow editor (manually, or via API): the workflow opens with empty canvas + ungated palette ready to drag.

**Tests** (target +2):
- Workflow v0 exists with status Draft and empty body (1)
- Workflow v0 has correct item and work center associations (1)

**Manual verification**:
- Run full seed on fresh DB.
- Open `/workflows` — verify both workflows appear in list.
- Open v1 — verify 4 phases render with correct groups and steps.
- Open v0 — verify empty canvas with ungated palette.
- Open `/work-orders` — verify WO-2026-PNE-0042 in `released` state.

**Gates D4** (FINAL):
- type-check + build + lint clean
- Full seed runs end-to-end without errors
- Cumul: ~642 → ~644 (target floor: 632 + 12 = 644; ideal: 632 + 16 = 648)
- STATUS.md updated

**Commit**: `feat(prisma-seed): pneumatic workflow v0 (Empty) + close PROMPT_PNE_2 (PROMPT_PNE_2 D4)`

---

## 7. Test target ladder

| Increment | Cumul | Floor | Ideal |
|---|---|---|---|
| Baseline | 632 | — | — |
| D1 | ~636 | ≥634 | ≥637 |
| D2 | ~639 | ≥637 | ≥640 |
| D3 | ~642 | ≥640 | ≥644 |
| D4 | ~644 | **≥644** | **≥648** |

Note: this PROMPT may end at ideal floor (644) rather than ideal ideal (648) because seed tests are integration-heavy; if D4 yields fewer tests, that's acceptable. Floor is non-negotiable.

---

## 8. Surprise budget

Stop and ask if:
- Prisma schema doesn't support `WorkflowVersion` with snapshot relation (would need migration — out of scope)
- WO release flow has hard validations not satisfied by the seed (e.g., requires assigned operators with verified shift) — adapt seed to satisfy, but report what was changed
- Existing seed script depends on TODO-031 Prisma generate — if so, run `pnpm --filter @mes/prisma generate` first, document in PROMPT closure

---

## 9. Touches TODO-031

This PROMPT is the natural place to address **TODO-031** (Prisma client cache gap, turbo dependsOn). Recommended fix:

In `turbo.json`, add to the `build` pipeline:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "@mes/prisma#generate"],
      ...
    },
    "@mes/prisma#generate": {
      "cache": false,
      "outputs": ["node_modules/.prisma/**"]
    }
  }
}
```

This ensures `prisma generate` runs before any `build` task that depends on the generated client. NOT a postinstall hook (would slow CI).

If implementing this is non-trivial (e.g., turbo schema validation), defer with a clear note in STATUS and keep TODO-031 open.

---

## 10. Exit criteria

- 4 increments committed
- Test cumul ≥ 644
- `pnpm --filter @mes/prisma seed:pneumatic` runs successfully on fresh DB and idempotently on warm DB
- Manual verification: 2 workflows + WO visible in respective lists
- STATUS.md updated
- TODO-031 either closed (with turbo.json change) or explicitly deferred with rationale

---

**End PROMPT_PNE_2**
