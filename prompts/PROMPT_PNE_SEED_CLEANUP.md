# PROMPT_PNE_SEED_CLEANUP — Workflow seed redesign for clean demo flow

> **Type**: Hotfix dopo F1 closure (NON nuovo PROMPT F2)
> **Effort**: 1-2h Claude Code
> **Calendar**: 3-4 maggio 2026
> **Demo target**: Reflexallen S.p.A. — 18-22 maggio 2026
> **Baseline**: 734 tests cumulative (post F1.6 PROMPT_PNE_4_FOCUSED D4)

---

## 1. Context

F1 (Pneumatic First) chiusa al 100% con 6 PROMPT consegnati e 734 test cumul. Codice F1 funziona (test verdi, smoke E2E pass). MA il smoke browser di Antonella sul HMI WO journey ha rivelato un problema **non nel codice, nel seed dati**:

Il workflow seed `wf-pneumatic-air-680-v1` (creato in PNE_2) ha modellato i recovery flow come **step inline normali** dentro la sequenza del workflow:

- `[REC-LEAK-DIAG] Diagnosis – select leak fault code`
- `[REC-LEAK-ATT-1] First retry – apply correction per fault`
- `[REC-LEAK-ATT-2] Second retry – alternative correction`
- `[REC-LEAK-SCRAP] Forced scrap – cause code mandatory`

Stesso pattern per camera (`REC-CAM-DIAG`, `REC-CAM-ATT-1`, etc.).

PNE_4_FOCUSED D4 ha shippato un **sistema recovery superiore**:
- `node.data.recoveryConfig` con `maxAttempts` + `preRetrySteps` (refs a step esistenti)
- HMI `HMIRecoveryFlow` modal su FAIL outcome con counter "Tentativo X/Y"
- HMI `HMIScrapForm` modal con cause code dropdown filtered + photo upload + notes

I due approcci coesistono nel sistema attuale ma producono UX confusa:
- HMI mostra `[STEP-LEAK-003] Run leak test cycle` come "Bloccato"
- Avanza al next step seedato (es. `[REC-LEAK-ATT-2]` se recovery context)
- Operatore vede recovery come step manuale OK/NOK invece che come modal HMIRecoveryFlow

**Root cause**: il seed PNE_2 NON conosceva il pattern `recoveryConfig` (era pre-D4). Quindi ha modellato recovery come step. Adesso che D4 ha shippato il pattern modal, il seed va aggiornato per coerenza.

**Goal hotfix**: re-design del workflow seed `wf-pneumatic-air-680-v1` con:
- Sequenza pulita Production phase (Pick → Mount → Leak Test → Camera Test → Conformity → Pack → Packaging)
- Recovery configurato come `node.data.recoveryConfig` sui device main steps (LEAK-003, CAM-001)
- Pre-retry steps come refs a step esistenti del workflow
- **RIMUOVERE** dai step seedati i `REC-LEAK-*` e `REC-CAM-*` come step inline
- Mantenere il workflow `wf-pneumatic-air-680-v0` (Empty) intatto (per demo Process Engineer)

---

## 2. Goal

Dopo questo hotfix:

1. **WO-2026-PNE-0042 esegue il workflow `wf-pneumatic-air-680-v1`** con sequenza pulita:
   - Phase 1 Setup (auto-gen, già pulita)
   - Phase 2 Production con flow lineare:
     - Pick tube
     - Mount fittings
     - Leak Test group: pre-steps (Insert into chuck + Connect hoses) → device main 45s + parallel slots (Apply label + Apply tape) → post-step (Read result + Disconnect)
     - Camera Test group: pre-step (Position) → device main 8s + parallel slots → post-step (Validate ROI)
     - Conformity check (decision step)
     - Serial scan + Pack into box
     - Conditional Packaging trigger (when box full)
   - Phase 3 Outbound (esistente)
   - Phase 4 Teardown (esistente, auto-gen)

2. **Recovery flow funziona via D4 modal**, non come step inline:
   - Click "Avvia ciclo" su `[STEP-LEAK-003]` → simulator runs
   - Su FAIL outcome → `HMIRecoveryFlow` modal apre (NON avanza a `REC-LEAK-DIAG` come prima)
   - Counter "Tentativo 1/2" + buttoni "Riprova"/"Scarta"
   - Click "Riprova" → execute pre-retry steps (refs to existing manual steps via `recoveryConfig.preRetrySteps`) → re-launch device cycle
   - Click "Scarta" o `attempts == maxAttempts` → `HMIScrapForm` modal apre con cause code + photo
   - On confirm → `WO.qtyScrap++`, `WO.qtyRemaining++`, exit recovery, advance workflow

3. **Smoke completo del demo journey end-to-end PASS** funziona pulito:
   - Login Mario Rossi → WO-2026-PNE-0042 → step-by-step → workflow completed
   - NESSUN `[REC-LEAK-DIAG]` o `[REC-CAM-DIAG]` visibile come step
   - Recovery modal D4 visibile solo quando si forza FAIL via /demo

4. **Tests pass after seed re-design**: tutti i test esistenti continuano a funzionare (potrebbe servire aggiornare 1-2 test che dipendono da step REC-* count).

---

## 3. Implementation plan

### Step 1 — Pre-flight check (15 min)

**File da leggere prima**:
- `packages/prisma/seed/pneumatic-data/workflow-v1.ts` (file principale del seed)
- `packages/prisma/seed/pneumatic-data/cause-codes.ts` (cause codes recovery_fault)
- `apps/web/src/components/workflow/configurator/action-forms/AutomaticForm.tsx` (D4.1 implementation di recoveryConfig)
- `apps/hmi/src/app/wo/[id]/page.tsx` (D4.0 page renderer + HMIRecoveryFlow integration)

**Output pre-flight (1-3 lines)**:
- Quanti step `REC-*` ci sono nel seed v1?
- Esistono già step manual che potrebbero essere usati come `preRetrySteps` (es. "Verifica connessione tubi", "Pulisci sede")?
- recoveryConfig schema in node.data ha shape `{ enabled: bool, maxAttempts: number, preRetryStepIds: string[] }`?

Se anomalia, STOP e report.

### Step 2 — Identifica pre-retry step candidates esistenti (15 min)

Nel workflow v1 ci sono step manual setup tipo:
- `STEP-LEAK-001` Position tube on fixture
- `STEP-LEAK-002` Connect pneumatic hoses
- (altri analoghi nel pre-leak-test group)

Selezionare 2 step come pre-retry per LEAK_003:
- 1 candidato: "Verifica/pulisci sede tubo" (riusa STEP-LEAK-001 logic)
- 2 candidato: "Riconnetti tubi" (riusa STEP-LEAK-002 logic)

**Decision rule**: se step ideali per pre-retry NON esistono ancora nel seed, **AGGIUNGI** 2 step manual nuovi nel pre-leak-test group:
- `STEP-LEAK-RECOVERY-CHECK` (manual, action_type: visual_check, "Verifica integrità tubo e sede")
- `STEP-LEAK-RECOVERY-CLEAN` (manual, action_type: process, "Pulisci sede e riconnetti tubi")

Questi step **NON appaiono nel flow normale** (sono solo refs per pre-retry), MA sono presenti nel workflow per essere selezionabili come refs.

### Step 3 — Modify workflow-v1.ts seed (30-45 min)

**Modifiche al seed**:

#### 3.1 Production phase — Leak Test group

Struttura attuale (frammentata):
```yaml
Production phase:
  - STEP-LEAK-001 Position tube on fixture
  - STEP-LEAK-002 Connect hoses
  - REC-LEAK-DIAG Diagnosis (decision)            # RIMUOVI
  - STEP-LEAK-003 Run leak test cycle (device_main)
  - STEP-LEAK-004 Apply label (parallel)
  - STEP-LEAK-005 Apply tape (parallel)
  - STEP-LEAK-006 Prepare next tube (parallel)
  - REC-LEAK-ATT-1 First retry (manual)           # RIMUOVI
  - REC-LEAK-ATT-2 Second retry (manual)          # RIMUOVI
  - REC-LEAK-SCRAP Forced scrap (manual)          # RIMUOVI
  - STEP-LEAK-007 Read result (post)
  - STEP-LEAK-008 Disconnect hoses (post)
  - STEP-LEAK-009 Remove tube (post)
```

Struttura nuova (pulita):
```yaml
Leak Test group:
  - STEP-LEAK-001 Position tube on fixture (pre)
  - STEP-LEAK-002 Connect hoses (pre)
  - STEP-LEAK-003 Run leak test cycle (device_main)
    node.data.recoveryConfig:
      enabled: true
      maxAttempts: 2
      preRetryStepIds:
        - <ID di STEP-LEAK-RECOVERY-CHECK>
        - <ID di STEP-LEAK-RECOVERY-CLEAN>
  - STEP-LEAK-004 Apply label (parallel)
  - STEP-LEAK-005 Apply tape (parallel)
  - STEP-LEAK-006 Prepare next tube (parallel)
  - STEP-LEAK-007 Read result (post)
  - STEP-LEAK-008 Disconnect hoses (post)
  - STEP-LEAK-009 Remove tube (post)
  
  # Hidden recovery steps (refs only, not in flow):
  - STEP-LEAK-RECOVERY-CHECK (manual, NON in linear flow)
  - STEP-LEAK-RECOVERY-CLEAN (manual, NON in linear flow)
```

**Implementazione**:
- Remove `REC-LEAK-DIAG`, `REC-LEAK-ATT-1`, `REC-LEAK-ATT-2`, `REC-LEAK-SCRAP` from step list
- Add `recoveryConfig` to STEP-LEAK-003 node.data
- Add 2 new manual steps STEP-LEAK-RECOVERY-CHECK / CLEAN (or reuse existing if equivalent)
- Update group `stepCount` and any related metadata

#### 3.2 Production phase — Camera Test group

Stesso pattern di Leak Test:

```yaml
Camera Test group:
  - STEP-CAM-001 Position tube in camera fixture (pre)
  - STEP-CAM-002 Run camera cycle (device_main)
    node.data.recoveryConfig:
      enabled: true
      maxAttempts: 2
      preRetryStepIds:
        - <ID di STEP-CAM-RECOVERY-CLEAN>
  - STEP-CAM-003 Read camera result (post)
  
  # Hidden recovery steps:
  - STEP-CAM-RECOVERY-CLEAN (manual)
```

**Remove**: `REC-CAM-DIAG`, `REC-CAM-ATT-1`, `REC-CAM-ATT-2`, `REC-CAM-SCRAP`.

#### 3.3 Production phase — sequenza completa pulita

Dopo cleanup:

```
Phase 2 Production:
  Group: Pick + Mount
    - STEP-PICK-001 Pick tube
    - STEP-MOUNT-001 Mount raccordo end A (RACC-PNE-12-A)
    - STEP-MOUNT-002 Mount raccordo end B (RACC-PNE-12-B)
  
  Group: Leak Test (con pre/main/parallel/post + recoveryConfig)
    [come sopra]
  
  Group: Camera Test (con pre/main/post + recoveryConfig)
    [come sopra]
  
  Group: Conformity Check
    - STEP-CONFORMITY-001 (decision step, manual_choice PASS/FAIL)
  
  Group: Serial + Pack
    - STEP-SERIAL-001 Scan serial label
    - STEP-PACK-001 Pack into box (BTYPE-PLT-RFA-001)
    - STEP-VALIDATE-001 Validate box capacity (validate_box_capacity)
```

(Phase 3 Outbound + Phase 4 Teardown rimangono invariate.)

### Step 4 — Update tests (15-30 min)

**Test da verificare**:
- `apps/api/.../seed-pneumatic.test.ts` (se esiste): aggiornare aspettative count step
- `apps/web/.../workflow-v1.spec.ts` (se esiste): aspettative struttura workflow
- HMI tests che dipendono da step `REC-*` count

**Approccio**: run `pnpm test`, identificare test che falliscono per il cleanup, aggiustare aspettative (count step, presenza/assenza specifici code REC-*).

**Atteso**: test count stays at **734** (stesso del D4) o varia di poco (+/- 2-3 test). Niente regressioni.

### Step 5 — Re-seed pneumatic and smoke (15-30 min)

```bash
pnpm --filter @mes/prisma db:reset
pnpm --filter @mes/prisma seed:pneumatic
```

**Verify**:
- Workflow `wf-pneumatic-air-680-v1` ha la struttura nuova
- WO-2026-PNE-0042 esegue il workflow nuovo
- STEP-LEAK-003 ha `recoveryConfig` con `maxAttempts=2` + `preRetryStepIds=[STEP-LEAK-RECOVERY-CHECK, STEP-LEAK-RECOVERY-CLEAN]`
- Step REC-LEAK-* / REC-CAM-* NON esistono più nel seed

**Manual smoke**:
1. `pnpm dev`
2. Browser HMI login Mario Rossi
3. Apri WO-2026-PNE-0042
4. Avanza step manualmente — atteso:
   - Pick tube → Mount fittings → Position fixture → Connect hoses → STEP-LEAK-003
5. Quando arrivi a STEP-LEAK-003 (active):
   - Atteso: DeviceCycleWithParallels visibile (timer 45s + LeakTelemetry + 3 parallel slots)
   - Click "Avvia ciclo" → cycle parte
   - Aspetta cycle complete (45s) o usa /demo Force PASS
   - Outcome PASS → "Continua" → workflow advances a STEP-LEAK-004 (parallel apply label) o post-step
6. Per testare FAIL recovery:
   - Reset DB, apri /demo, "Force FAIL" su DEV-LEAK-001
   - Re-walk WO fino a STEP-LEAK-003
   - Click "Avvia ciclo" → cycle FAIL
   - Atteso: HMIRecoveryFlow modal apre (NON avanza a step REC-* perché non esistono più)
   - Counter "Tentativo 1/2" + bottoni "Riprova" / "Scarta"
   - Click "Riprova" → esegue STEP-LEAK-RECOVERY-CHECK + STEP-LEAK-RECOVERY-CLEAN come step manual standalone → re-launch cycle
   - Se ancora FAIL → counter "Tentativo 2/2" → re-launch
   - Se ancora FAIL → auto trigger HMIScrapForm
   - O click "Scarta" anytime → HMIScrapForm
   - Modal apre: cause code dropdown LK-* + photo upload + notes
   - Conferma → WO.qtyScrap++, exit recovery

### Step 6 — Update STATUS.md + commit (10-15 min)

Add to STATUS.md:

```markdown
## Hotfix — PROMPT_PNE_SEED_CLEANUP (post F1 close)

Re-designed `wf-pneumatic-air-680-v1` seed to align with D4.1 recoveryConfig pattern.

Changes:
- Removed inline recovery steps: REC-LEAK-DIAG, REC-LEAK-ATT-1, REC-LEAK-ATT-2, REC-LEAK-SCRAP, REC-CAM-DIAG, REC-CAM-ATT-1, REC-CAM-ATT-2, REC-CAM-SCRAP (8 steps removed from main flow)
- Added recoveryConfig to STEP-LEAK-003 + STEP-CAM-002 (maxAttempts=2 + preRetryStepIds)
- Added 3 hidden recovery steps as refs only (STEP-LEAK-RECOVERY-CHECK, STEP-LEAK-RECOVERY-CLEAN, STEP-CAM-RECOVERY-CLEAN)
- Production phase now linear and clean: Pick → Mount → Leak Test → Camera Test → Conformity → Pack
```

Commit message:

```
fix(prisma-seed): redesign pneumatic workflow v1 to use recoveryConfig pattern (post F1 hotfix)

- Remove inline recovery steps (REC-LEAK-* + REC-CAM-*, 8 total)
- Add recoveryConfig to LEAK-003 + CAM-002 device main steps
- Add 3 hidden recovery refs steps (RECOVERY-CHECK + RECOVERY-CLEAN x2)
- Production phase now linear: Pick → Mount → Leak → Camera → Conformity → Pack
- Aligns seed with D4.1 HMIRecoveryFlow modal pattern
- Tests: 734 -> ~734 (stable, minor count adjustments)
```

---

## 4. Out of scope (deferred)

NOT in this hotfix:
- ❌ Auto-print label trigger on leak start (deferred to PROMPT_PNE_5 post-demo)
- ❌ Warning informational parallel step "Allontanati dall'area" (deferred)
- ❌ Conditional Packaging group activation on box.currentUnits == capacity (deferred)
- ❌ Workflow editor UI for recoveryConfig editing (already shipped in D4.1, no UI changes needed)
- ❌ Schema migration (recoveryConfig stays session-only in node.data)

---

## 5. Pre-flight checks (STOP conditions)

Before Step 3, verify:

1. **Branch state**: clean working tree on main, HEAD = `6460a1a` (D4 closure). If different, STOP.

2. **Test baseline**: `pnpm test` returns 734 passing. If lower, STOP and report.

3. **Seed file exists**: `packages/prisma/seed/pneumatic-data/workflow-v1.ts` o equivalente. Se path diverso, identifica il file giusto e report.

4. **D4 components verified shipped**:
   - `apps/hmi/src/components/HMIRecoveryFlow.tsx` exists (or similar HMI recovery modal)
   - `apps/hmi/src/components/HMIScrapForm.tsx` exists
   - `apps/web/.../AutomaticForm.tsx` has Recovery section
   - If missing, STOP — D4 didn't ship correctly.

5. **Cause codes seed**: `category='recovery_fault'` codes exist (LK-* and CM-*). Run query to verify count.

If any STOP, report state and wait.

---

## 6. Surprise budget

S1 — **Test breakage**: removing REC-* steps may break tests that assert specific step counts (e.g., "workflow has 34 steps"). Acceptable: update tests to match new structure, document delta.

S2 — **Pre-retry step naming**: if exact ideal manual steps don't exist in seed, ADD 2-3 new ones (STEP-LEAK-RECOVERY-CHECK + CLEAN, STEP-CAM-RECOVERY-CLEAN). They appear only as refs in recoveryConfig, NOT in linear flow. If unclear how to mark "hidden from flow", ASK.

S3 — **Existing WO state inconsistency**: the seeded WO-2026-PNE-0042 references the OLD workflow. Re-seeding should reset everything cleanly. If WO has stale step refs after re-seed, STOP and ASK.

S4 — **Recovery modal trigger validation**: the HMI integration assumes specific behavior on cycle FAIL outcome. Verify by smoke that modal triggers correctly without inline recovery steps. If modal does NOT trigger, then there's a deeper integration bug from D4 → STOP and report.

S5 — **AutomaticForm UI editing**: if user wants to EDIT recoveryConfig via workflow editor (NOT just hardcoded in seed), verify D4.1 form supports it. If form doesn't accept seeded values cleanly, document and defer.

---

## 7. Closure deliverables

- Re-seeded workflow v1 with linear Production phase and recoveryConfig on device main steps
- 0 inline recovery steps remaining (REC-* all removed)
- 3 hidden recovery steps as refs (RECOVERY-CHECK + CLEAN x2)
- Tests passing (~734, minor adjustments OK)
- Manual smoke verified:
  - PASS path workflow execution clean (no REC-* visible)
  - FAIL recovery via HMIRecoveryFlow modal (not inline steps)
  - Pre-retry execution + re-launch cycle
  - Scrap form on attempts == max OR explicit Scarta click
- STATUS.md hotfix entry added
- Commit message conventional: `fix(prisma-seed): redesign pneumatic workflow v1 to use recoveryConfig pattern (post F1 hotfix)`
- Push to branch + PR

After commit + push: STOP, wait for user smoke verification + merge.

---

## 8. Workflow rules (per Antonella)

- Pre-flight per § 5 first; stop and report if anything unexpected
- Implement → run gates (test + lint + build) → 1-3 line report → wait for OK before commit
- Conventional commit message with `(post F1 hotfix)` suffix
- Stop on surprise per § 6
- Manual `pnpm dev` smoke gate: verify recovery modal flow end-to-end works after re-seed
- Don't auto-merge

---

End of PROMPT_PNE_SEED_CLEANUP specification.
