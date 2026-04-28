# PROMPT 4 — AUTO-GENERATION ENGINE v3

> **Type**: Build prompt for Claude Code (Step 4 of 6)
> **Pre-requisite**: PROMPT_1 + PROMPT_2 + PROMPT_3 completed; CLAUDE.md at repo root
> **Estimated time**: 2-3 hours
> **Last updated**: 2026-04-27

---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the AUTO-GENERATION ENGINE for the Reflexallen MES.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Implement the 7 auto-generation rules that produce setup/teardown phases
automatically when a Work Order is released. After this step:

- When WO is released, system AUTO-CREATES setup steps (skills, BOM, tools, devices, FAI)
- When WO completes, system AUTO-CREATES teardown steps (cleanup, reset, archive)
- Auto-generated steps appear in the workflow snapshot
- Operator sees them in HMI as part of normal flow
- Process Engineer can configure rules per workflow (enable/disable each rule)

This is the BRAIN of the MES — it converts static workflows into dynamic,
context-aware production runs.

═══════════════════════════════════════════════════════════════════════════════
PRE-REQUISITES
═══════════════════════════════════════════════════════════════════════════════

You should have already completed and committed PROMPT_3 (Workflow Designer).
Verify:
✓ Workflows can be created visually
✓ Workflows can be approved and published
✓ WorkflowSnapshot creates on WO release
✓ All registries (PROMPT_2) populated

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

Beyond CLAUDE.md context, also read:

→ docs/MASTER_SPECIFICATION.md section 8.3 (the 7 auto-generation rules)
→ docs/MASTER_SPECIFICATION.md sections 9-10 (Work Order lifecycle, Recovery)
→ docs/BEST_PRACTICES.md sections about service patterns
→ docs/extensions/EQUIPMENT_MANAGEMENT.md (tooling, maintenance integration)
→ docs/extensions/INDUSTRIAL_OPERATIONS.md (FAI, sampling, quality hold)
→ docs/extensions/MOCK_DATA_PNEUMATIC_AIR.md (concrete example data)
→ docs/extensions/WORKFLOW_PNEUMATIC_AIR_DETAILED.md (auto-gen in context)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

Read the documents above, then propose a plan covering:

1. THE 7 AUTO-GENERATION RULES (per MASTER_SPEC § 8.3)

   For EACH rule, define:
   - Trigger condition (when does it activate?)
   - Generated steps (what gets added?)
   - Insertion point (where in the workflow?)
   - Configuration (per-WO enable/disable)
   - Edge cases
   
   1.1 Rule #1: Skills & Login Verification
       - Trigger: WO released, has steps requiring skills
       - Generates: 
         * Step "Operator Login" (badge + PIN scan)
         * Step "Skill Matrix Verification" (validates each operator has required skills)
       - Insertion: Beginning of Setup phase
       - Config: Always on (cannot disable, mandatory)
       - Edge cases: Skills expiring < 30 days, override audit
   
   1.2 Rule #2: BOM Check Sequenziale
       - Trigger: WO released, item has BOM
       - Generates:
         * One step per BOM line (scan lot, verify quantity, reserve)
         * Order: critical materials first (by criticality flag)
       - Insertion: After Skills check, in Setup phase
       - Config: Can disable per WO (rare cases)
       - Edge cases: Lot expired, lot in quarantine, insufficient quantity, split lots
   
   1.3 Rule #3: Tooling Check
       - Trigger: WO released, workflow uses specific tools
       - Generates:
         * One step per required tool (scan tool, verify availability, check wear)
       - Insertion: After BOM check, in Setup phase
       - Config: Can disable per WO
       - Edge cases: Tool in maintenance, wear exceeded, calibration expired
   
   1.4 Rule #4: Device Verify & Recipe Load
       - Trigger: WO released, workflow uses devices
       - Generates:
         * Step "Power on device X"
         * Step "Load recipe Y on device X"
         * Step "Wait for warm-up" (per device)
       - Insertion: After Tooling check, in Setup phase
       - Config: Can disable per WO
       - Edge cases: Device offline, recipe rejected, warm-up timeout
   
   1.5 Rule #5: First Piece Approval (FAI)
       - Trigger: WO released, item requires FAI per BOM/recipe metadata
       - Generates:
         * Step "Run first piece (transitorio)"
         * Step "Visual inspection FA"
         * Step "Dimensional check FA"
         * Step "FAI report generation"
         * Step "QC Manager approval" (BLOCKS PRODUCTION until approved)
       - Insertion: End of Setup phase, before Production
       - Config: Required for new items, optional for repeat
       - Edge cases: FAI rejected, requires process correction
   
   1.6 Rule #6: Reset & Cleanup (Teardown)
       - Trigger: WO completed (all production done)
       - Generates:
         * Step "Unload device recipes"
         * Step "Purge materials"
         * Step "Cool down devices"
         * Step "Clean stations"
         * Step "Tool inspection + return"
       - Insertion: Beginning of Teardown phase
       - Config: Always on
       - Edge cases: Devices in error state, manual override
   
   1.7 Rule #7: Box Packaging
       - Trigger: Production phase nearing completion (every N pieces produced)
       - Generates:
         * Step "Select empty box of type X"
         * Step "Pack pieces (qty per box)"
         * Step "Validate capacity (HARD weight, WARNING units)"
         * Step "Seal box (if requiresSeal)"
         * Step "Apply label"
       - Insertion: Within Production phase or in dedicated Packaging phase
       - Config: Always on if BoxType configured for item
       - Edge cases: Box damaged, capacity exceeded, returnable inspection needed

2. AUTO-GENERATION SERVICE
   
   2.1 Architecture
       - apps/api/auto-generation/
         * AutoGenerationService (orchestrator)
         * SkillsRule, BomRule, ToolingRule, DeviceRule, FAIRule, TeardownRule, BoxRule
       - Each rule implements IAutoGenRule interface:
         * canApply(wo, workflow) → boolean
         * generate(wo, workflow, context) → Step[]
       - Rules execute in order on WO release event
   
   2.2 Triggering
       - Domain event: workOrder.released
       - Listener: AutoGenerationListener
       - Acquires lock on WO (avoid race conditions)
       - Runs rules sequentially
       - Updates workflow snapshot with generated steps
   
   2.3 Configuration
       - Per-WO config (override workflow defaults)
       - Stored in WorkOrder.autoGenConfig (JSON)
       - UI in WO release dialog
       - Some rules mandatory (cannot disable), some optional

3. INTEGRATION WITH WORKFLOW SNAPSHOT
   
   3.1 Snapshot enrichment
       - Auto-gen steps marked with isAutoGenerated: true
       - Cannot be edited or deleted by operator
       - Marked with lock icon in HMI
       - Audit log shows which rule generated each step
   
   3.2 Snapshot order
       1. Workflow phases as designed (from PROMPT_3)
       2. Setup phase (auto-prepended if needed)
          - Skills check (Rule #1)
          - BOM check (Rule #2)
          - Tooling check (Rule #3)
          - Device verify (Rule #4)
          - FAI (Rule #5)
       3. Production phases (as designed)
          - Box packaging (Rule #7) inline
       4. Teardown phase (auto-appended)
          - Cleanup (Rule #6)

4. UI: WORK ORDER RELEASE DIALOG
   
   When releasing a WO, show:
   - Summary of auto-gen rules to apply
   - Toggle for each optional rule (with warning if disabled)
   - Preview of generated steps
   - Validation: all prerequisites met (skills, materials, tools available)
   - Confirm release → triggers auto-generation
   
   Mockup:
   ```
   ┌─────────────────────────────────────────┐
   │ Release Work Order WO-2026-0142         │
   ├─────────────────────────────────────────┤
   │ Item: Tubo pneumatico 12mm × 2m         │
   │ Quantity: 100                           │
   │ Workflow: WF-PNE-12X2-001 v3            │
   │                                         │
   │ Auto-Generation Rules:                  │
   │ [✓] Skills & Login (mandatory)          │
   │ [✓] BOM Check Sequenziale               │
   │ [✓] Tooling Check                       │
   │ [✓] Device Verify & Recipe Load         │
   │ [✓] First Piece Approval (FAI)          │
   │ [✓] Reset & Cleanup                     │
   │ [✓] Box Packaging (50 pcs/box)          │
   │                                         │
   │ This will generate 27 additional steps. │
   │                                         │
   │ Pre-flight checks:                      │
   │ ✓ All operators available               │
   │ ✓ All materials in stock                │
   │ ✓ All tools available                   │
   │ ✓ All devices online                    │
   │                                         │
   │ [Cancel]              [Release WO]      │
   └─────────────────────────────────────────┘
   ```

5. UI: HMI INDICATION
   
   In HMI step renderer (built in PROMPT_5), auto-gen steps:
   - Show lock icon
   - Tooltip: "Auto-generated by Rule #N"
   - Cannot be skipped by operator (no "Skip" button)
   - Cannot be customized at runtime

6. RECOVERY FROM AUTO-GEN FAILURES
   
   If an auto-gen step fails (e.g., tool not available):
   - Recovery flow as defined in workflow
   - If unrecoverable: WO blocked, notify supervisor
   - Cannot proceed without resolving
   - Audit log captures everything

7. PERFORMANCE
   
   Auto-generation must be fast:
   - WO release → auto-gen complete in < 5 seconds for typical WO
   - For complex WOs (CFRP with many materials): < 15 seconds
   - Run async if > 30 seconds expected (queue with status)

8. TESTS
   
   - Each rule: unit tests with various inputs
   - Integration: full WO release → auto-gen → snapshot updated
   - E2E: from UI release dialog to operator seeing auto-gen steps in HMI
   - Edge cases: missing skills, expired lots, broken tools

9. VERIFICATION STEPS
   
   - Release a WO from UI
   - Verify all 7 rules generate expected steps
   - Verify auto-gen steps appear in WorkflowSnapshot
   - Verify lock icon in HMI (placeholder for PROMPT_5)
   - Verify audit log captures everything
   - Performance: < 5 sec for standard WO

After presenting your plan, STOP and wait for my approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed in this order:

STEP 2.1 — Domain logic
  - packages/domain: AutoGenRule interface
  - packages/domain: Each rule as pure function (testable in isolation)
  - packages/domain: Rule order/priority logic
  - Tests: 30+ tests (covering all 7 rules + edge cases)

STEP 2.2 — Service layer
  - apps/api/auto-generation: AutoGenerationService
  - Rule registry pattern (each rule registered as provider)
  - Runs sequentially on workOrder.released event
  - Acquires distributed lock (Redis) to prevent race
  - Verify: integration tests (10+)

STEP 2.3 — Implement Rule #1 (Skills & Login)
  - Generate Operator Login step
  - Generate Skills Verification step
  - Validate against current operator-skill matrix
  - Verify: unit tests + integration test

STEP 2.4 — Implement Rule #2 (BOM Check Sequenziale)
  - Order BOM lines by criticality
  - Generate one step per line
  - Reserve lots (soft reservation)
  - Handle split lots if quantity needs > 1 lot
  - Verify: tests for full + split + insufficient cases

STEP 2.5 — Implement Rule #3 (Tooling Check)
  - For each tool in workflow: generate verify step
  - Check wear status (block if exceeded)
  - Check calibration (block if expired)
  - Verify: tests for available + maintenance + worn cases

STEP 2.6 — Implement Rule #4 (Device Verify & Recipe Load)
  - For each device: power on + load recipe + warm-up
  - Recipe must be approved + effective for the date
  - Verify: tests

STEP 2.7 — Implement Rule #5 (FAI / First Piece)
  - Determine if FAI required (item.requiresFAI flag, or new revision)
  - Generate FAI sequence (5 steps)
  - Set workOrder.productionBlocked = true until FAI approved
  - Verify: tests

STEP 2.8 — Implement Rule #6 (Reset & Cleanup)
  - Triggered on workOrder.allProductionComplete
  - Generate teardown steps based on devices used + tooling used
  - Verify: tests

STEP 2.9 — Implement Rule #7 (Box Packaging)
  - Calculate boxes needed: qtyTarget / boxType.capacityUnits
  - Generate packaging steps inline with production
  - Handle box state machine (filling → sealed → shipped)
  - Verify: tests

STEP 2.10 — Frontend: WO release dialog
  - apps/web: ReleaseWorkOrderDialog component
  - Shows rules to apply (with toggles)
  - Pre-flight checks (with loading)
  - Preview generated steps count
  - Confirm → POST /api/work-orders/:id/release
  - Verify: E2E test

STEP 2.11 — Frontend: snapshot enrichment indicator
  - In WorkflowSnapshot detail view, show auto-gen steps with badge
  - Tooltip with rule name
  - Verify: visible in UI

STEP 2.12 — Performance optimization
  - Profile auto-gen runtime
  - If slow: parallelize where possible (rules independent)
  - Add timing logs
  - Verify: < 5 sec for typical WO

STEP 2.13 — Audit & events
  - AuditLog entry for each generated step
  - Domain event: workOrder.autoGenerated (with details)
  - Real-time notification to release operator
  - Verify: audit complete

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY & REPORT
═══════════════════════════════════════════════════════════════════════════════

Generate STATUS REPORT covering:
- ✓ All 7 rules implemented
- ✓ Each rule tested (count tests per rule)
- ✓ Integration tests pass
- ✓ E2E test: release WO with full auto-gen
- ✓ Performance: < 5 sec for typical WO
- ✓ Audit log captures everything
- Suggested commit message

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

[ ] All 7 auto-gen rules implemented
[ ] Each rule has > 5 unit tests passing
[ ] Integration tests cover full WO release scenario
[ ] WO release dialog UI works
[ ] Auto-gen steps appear in WorkflowSnapshot
[ ] Auto-gen steps marked with lock (cannot edit/skip)
[ ] Audit log captures rule applications
[ ] Performance: < 5 sec for standard WO
[ ] Performance: < 15 sec for complex WO (CFRP)
[ ] Edge cases handled (missing skills, broken tools, etc.)
[ ] Real-time notification on release
[ ] Design tokens applied to release dialog

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read the additional files listed above
2. Verify PROMPT_3 work (Workflow Designer functional)
3. Present detailed plan
4. Wait for approval
5. Build step by step
6. Generate status report

START WITH THE PLAN.
```

(End of prompt to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### Why this prompt is critical

Auto-generation is what makes the MES "smart". Without it, every workflow
must explicitly include every step. With it, workflows stay clean (focus on
production logic) while setup/teardown happens automatically.

This is also a place where bugs are subtle. A rule generating wrong steps
could cause production stops, scrap, or quality issues.

### Watch out for these issues

**Issue 1**: Claude Code might combine rules into a single function.
- Reject. Each rule must be a separate, testable unit. Future rules will be added.

**Issue 2**: Claude Code might forget the lock mechanism.
- Push back. Race conditions on WO release will cause duplicate setups.

**Issue 3**: Claude Code might not handle BOM split lots properly.
- Verify. If a material needs 8.5 kg and the lot has 5 kg + another 4 kg,
  the rule must split the consumption.

**Issue 4**: Performance degradation with many rules.
- Profile. If > 5 sec for typical WO, optimize before "done".

### How long this should take

| Activity | Estimated time |
|---|---|
| Read additional specs | 15 min |
| Plan proposal | 20 min |
| Plan review | 10 min |
| Build (~13 steps) | 90-120 min |
| Verify | 20 min |
| Status report | 10 min |
| **Total** | **2.5-3 hours** |

### After this step

After PROMPT_4, the system can fully release a WO and see auto-generated
setup/teardown steps in the workflow snapshot. The next step (PROMPT_5)
implements the HMI where operators actually execute these steps.

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial v3 prompt (created with CLAUDE.md auto-load pattern) |
