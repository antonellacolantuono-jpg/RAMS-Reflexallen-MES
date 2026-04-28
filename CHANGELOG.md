# Changelog

All notable changes to the Reflexallen MES project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to a custom versioning scheme described in [docs/VERSIONING.md](./docs/VERSIONING.md).

---

## [Unreleased]

Items currently being worked on but not yet committed.

### To add
- Build phase 1: foundation (apps + packages + Prisma schema)
- Build phase 2: master data registries with seed
- Build phases 3-6: workflow designer, auto-gen, HMI, reporting

---

## Specifications v1.2 — 2026-04-27

Major specification expansion adding 5 modular extensions and 2 verticals 
(CFRP and Safety Devices) to the core domain.

### Added — Core domain
- WorkOrderAssignment entity with 5 statuses + skills coverage validation
- MaintenanceOrder + MaintenanceLog (4 lifecycle statuses, 4 maintenance types)
- ToolWear tracking (5 statuses) + ToolReplacement audit
- Equipment State Machine formalized with XState (8 states)
- Sample taking entity (4 sample types, separate from production count)
- FAIReport (PPAP-compliant, blocks production until approved)
- WIPContainer + Subassembly with nested BOM
- LotHold + LotHoldAction (5 hold reasons)
- ContinuousProductionRun for long-running operations (extrusion)
- Multi-output cycles (1 cycle → N pieces)
- Quality Hold/Release workflow

### Added — CFRP module
- Mold + MoldCycle (cycles count tracking with lifetime limits)
- PrepregRoll + PrepregOutTimeRecord (cumulative out-time, max 30 days)
- CureCycleRun + CureCycleTelemetry (long-running 4-12h jobs)
- LayupLog (per-ply tracking)
- VacuumBagTest
- NDTResult (Non-Destructive Testing integration)

### Added — Safety Devices module
- ReflectiveFilmRoll
- HomologationCertificate (ECE-R104 lifecycle)
- ReflectanceTest (with thresholds per color)
- ColorimetryTest (CIE-Lab measurements)
- LaminationRecord
- CrossCutAdhesionTest (ASTM D3359)
- AgingTestSpecimen + AgingTestMeasurement (long-running QUV tests)

### Added — Documentation
- 5 modular extension files in docs/extensions/:
  - EQUIPMENT_MANAGEMENT.md
  - SCHEDULING_ASSIGNMENT.md
  - INDUSTRIAL_OPERATIONS.md
  - CFRP_MODULE.md
  - SAFETY_DEVICES_MODULE.md
- 8 workflow reference files in docs/extensions/:
  - WORKFLOW_PNEUMATIC_AIR.md (high-level)
  - WORKFLOW_PNEUMATIC_AIR_DETAILED.md (step-by-step + branching)
  - WORKFLOW_CFRP.md (high-level)
  - WORKFLOW_CFRP_DETAILED.md (step-by-step)
  - WORKFLOW_SAFETY_DEVICES.md (high-level)
  - WORKFLOW_SAFETY_DEVICES_DETAILED.md (step-by-step)
  - WORKFLOW_FLUID_POWER.md (V2, INVENTED with disclaimer)
  - WORKFLOW_DIGITAL_ELECTRICAL.md (V2, INVENTED with disclaimer)
- FUNCTIONAL_INVENTORY.md (227 features classified MVP/V2)
- MOCK_DATA_PNEUMATIC_AIR.md (120+ concrete entities for seed)

### Added — Architecture Decision Records (ADRs)
- ADR-018: Equipment State Machine (XState formalization)
- ADR-020: Continuous Production Mode separation
- ADR-021: Sample taking decoupled from production count
- ADR-022: WorkOrderAssignment with skills coverage
- ADR-023: Maintenance lifecycle and triggers
- ADR-024: Tool Wear tracking strategy
- ADR-025: WIP container management
- ADR-026: CFRP-specific patterns (Mold cycles, Prepreg out-time, Cure cycles)
- ADR-027: Safety Devices ECE-R104 compliance
- (See MASTER_SPECIFICATION.md for complete list of 27 ADRs)

### Updated
- MASTER_SPECIFICATION.md: 3230 lines, 22 sections, 56+ enums
- BEST_PRACTICES.md: 5241 lines, 9 anti-patterns documented
- CONVENTIONS.md: 1392 lines with per-module sections

### Notes
- Spec version v1.2 is the current target for MVP build
- Spec versions v1.0 and v1.1 are obsolete (not committed in current state)

---

## Build Prompts v3 — 2026-04-27

Major refactor of build prompts to support CLAUDE.md auto-load pattern,
plus addition of remaining 4 prompts to complete the 6-step build roadmap.

### Added
- CLAUDE.md at repo root (auto-loaded by Claude Code on session start)
- prompts/PROMPT_3_WORKFLOW_DESIGNER.md (canvas + 4-pane configurator)
- prompts/PROMPT_4_AUTO_GENERATION.md (engine for 7 auto-gen rules)
- prompts/PROMPT_5_EXECUTION_HMI.md (shop floor HMI with 8 step renderers)
- prompts/PROMPT_6_DASHBOARD_REPORTING.md (OEE, FPY, KPI dashboards)

### Changed
- prompts/PROMPT_1_FOUNDATION.md: removed onboarding section (now in CLAUDE.md), 
  added explicit reading list, design tokens integration
- prompts/PROMPT_2_REGISTRIES.md: same refactor + design tokens compliance section

### Removed
- prompts/MASTER_PROMPT.md: content migrated to CLAUDE.md (auto-load pattern)

### Workflow change
**Before (v2)**: User pastes MASTER_PROMPT + PROMPT_X for each session.
**After (v3)**: User pastes only PROMPT_X. CLAUDE.md auto-loaded by Claude Code.

---

## Automation Scripts v2 — 2026-04-27

Updated automation scripts to handle the complete project structure including 
docs/extensions/ folder and all v1.2 documentation files.

### Added
- Routing for 5 modular extensions
- Routing for 8 workflow files
- Routing for FUNCTIONAL_INVENTORY.md
- Routing for MOCK_DATA_*.md files (current and future)
- Routing for PROMPT_3-6 files (current and future)
- Smart "skip if identical" via SHA-256 hash check
- NEW vs MODIFIED vs SKIPPED diff display
- docs/extensions/ folder auto-creation in setup
- Project README.md verification step

### Changed
- update-docs.ps1: routing rules from 5 patterns to 24+ patterns
- setup-environment.ps1: creates docs/extensions/ folder
- scripts/README.md: complete file routing table documented

### Files
- scripts/update-docs.ps1 v2 (363 lines)
- scripts/setup-environment.ps1 v2 (300 lines)
- scripts/README.md v2 (316 lines)
- README.md (root, NEW, 361 lines)

---

## Specifications v1.0 — Initial baseline

The original specifications. Now superseded by v1.2.

### Was included (high-level)
- Core MES domain (Items, BOM, Equipment, Workflows, Work Orders)
- Pneumatic Air production line
- Basic registries
- Initial workflow designer concept
- ~10 ADRs

### Notes
- Pre-v1.2 documents are not preserved in the current state.
- v1.2 supersedes v1.0 + v1.1 entirely.

---

## Format guide

### Section types

- **Added** — New features or files
- **Changed** — Changes to existing functionality
- **Deprecated** — Soon-to-be removed features (still available)
- **Removed** — Removed features
- **Fixed** — Bug fixes
- **Security** — Security-related changes

### Versioning entries

This project has 3 versioning dimensions, each with its own changelog section:

1. **Specifications** — versioned as `Specifications vX.Y`
2. **Build Prompts** — versioned as `Build Prompts vN`
3. **Code (when build starts)** — versioned as `vX.Y.Z` (Semantic Versioning)

See [docs/VERSIONING.md](./docs/VERSIONING.md) for the complete versioning rules.

---

## Links

- [Repository](https://github.com/antonellacolantuono-jpg/RAMS-V.4)
- [Versioning rules](./docs/VERSIONING.md)
- [Project README](./README.md)
- [Master Specification](./docs/MASTER_SPECIFICATION.md)
