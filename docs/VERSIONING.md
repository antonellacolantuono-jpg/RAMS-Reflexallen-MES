# Versioning Rules — Reflexallen MES

> **Purpose**: Document HOW we version specifications, prompts, and code.
> **Audience**: Developers, Process Engineers, Antonella (project owner), Claude Code
> **Last updated**: 2026-04-27

---

## 🎯 Why a custom versioning scheme

The Reflexallen MES project has **3 distinct things** that evolve independently:

1. **Specifications** (the domain knowledge — what the MES does)
2. **Build Prompts** (the operational instructions for Claude Code)
3. **Application Code** (the actual software running)

Each evolves at its own pace. Treating them with separate version numbers 
makes the project easier to maintain and reason about.

---

## 📊 The 3 versioning dimensions

### Dimension 1 — Specifications

**What it tracks**: The functional domain of the MES — entities, workflows, 
business rules, ADRs.

**Format**: `vMAJOR.MINOR` (e.g., `v1.2`)

**When MAJOR increments**:
- New production line added (e.g., Fluid Power becoming MVP)
- Drastic re-architecture of core domain
- Break-change in fundamental concepts

**When MINOR increments**:
- New module added within existing domain (e.g., Box Management, CFRP, Safety)
- Significant new feature group
- Multiple new entities or ADRs

**When NEITHER increments**:
- Typo fixes
- Clarification of existing text
- Adding examples

**Current version**: `v1.2`

**History**:
- `v1.0` — Initial specifications (Pneumatic Air baseline)
- `v1.1` — Added Box Management
- `v1.2` — Added Equipment Mgmt, Scheduling, Industrial Ops, CFRP, Safety Devices ⬅ current
- `v2.0` — Future: will add Fluid Power + Digital Electrical (V2 modules)

**Where it lives**: 
- `docs/MASTER_SPECIFICATION.md` (header version field)
- `CHANGELOG.md` (under "Specifications vX.Y" sections)

---

### Dimension 2 — Build Prompts

**What it tracks**: The prompts that instruct Claude Code how to build the MES.

**Format**: `vN` (single major number, e.g., `v3`)

**When N increments**:
- Pattern change in how prompts are used
- Restructure of prompt format
- Major addition of new prompts
- Breaking change in how Claude Code is expected to consume them

**When N does NOT increment**:
- Fixing a typo in a prompt
- Clarifying instructions
- Adding more detail to acceptance criteria

**Current version**: `v3`

**History**:
- `v1` — Initial monolithic prompts (only 3 files: MASTER, FOUNDATION, REGISTRIES)
- `v2` — Updated with v1.2 specs (still monolithic pattern)
- `v3` — Refactor to CLAUDE.md auto-load + completed 6-prompt roadmap ⬅ current

**Where it lives**:
- Each `prompts/PROMPT_*.md` file (header version field)
- `CLAUDE.md` (auto-loaded context)
- `CHANGELOG.md` (under "Build Prompts vN" sections)

**Compatibility**:
- v3 prompts require CLAUDE.md at repo root (auto-loaded)
- v1 and v2 prompts no longer maintained (use v3)

---

### Dimension 3 — Application Code

**What it tracks**: The actual software (apps, packages, deployments).

**Format**: `vMAJOR.MINOR.PATCH` (Semantic Versioning, e.g., `1.2.0`)

**When MAJOR increments**:
- Breaking changes (API signatures change, DB schema migration breaking)
- Major architectural shifts
- Removal of features
- Will require user/operator retraining

**When MINOR increments**:
- New features (backward-compatible)
- New modules added
- New API endpoints (without breaking existing)
- Significant UI improvements

**When PATCH increments**:
- Bug fixes
- Performance improvements
- Security patches
- Minor UI tweaks

**Current version**: `0.0.0` (not yet built)

**Planned trajectory**:
- `0.1.0` — After PROMPT_1 completes (foundation)
- `0.2.0` — After PROMPT_2 completes (registries)
- `0.3.0` — After PROMPT_3 completes (workflow designer)
- `0.4.0` — After PROMPT_4 completes (auto-gen)
- `0.5.0` — After PROMPT_5 completes (HMI)
- `1.0.0` — MVP COMPLETE (after PROMPT_6 — first production-ready release)
- `1.1.0+` — Patches and minor enhancements
- `2.0.0` — Future: V2 modules added

**Where it lives**:
- `apps/api/package.json` (`version` field)
- `apps/web/package.json`
- `apps/hmi/package.json`
- `apps/worker/package.json`
- All `apps/*` versions stay in sync (one product, one version)
- `packages/*/package.json` versions can differ (independent libraries)
- `CHANGELOG.md` (under "vX.Y.Z" sections at top)
- Git tags: `v1.0.0`, `v1.1.0`, etc.

---

## 🔗 Compatibility matrix

| Spec version | Compatible Prompts | Compatible Code |
|---|---|---|
| `v1.0` | `v1` | (none — pre-build) |
| `v1.1` | `v1` | (none — pre-build) |
| `v1.2` | `v3` | `0.1.0` to `1.0.0` (MVP build path) |
| `v2.0` | `v3+` (will need updates) | `1.1.0+` |

**Rule**: when specs major version changes, prompts must be updated to match.

---

## 📝 When and how to update versions

### Updating specifications version

**Trigger**: After significant addition of features documented in MASTER_SPEC + extensions.

**Steps**:
1. Update `docs/MASTER_SPECIFICATION.md` header: `Version: vX.Y`
2. Add change log entry inside `MASTER_SPECIFICATION.md`
3. Add `## Specifications vX.Y` section to root `CHANGELOG.md`
4. Update `CLAUDE.md` reference: `**Specifications version**: vX.Y`
5. Commit: `docs: bump spec version to vX.Y`

### Updating prompt version

**Trigger**: Major refactor in how prompts work or new prompts added.

**Steps**:
1. Update each `prompts/PROMPT_*.md` header: `Version: vN`
2. Update each "Change Log" inside the prompt files
3. Add `## Build Prompts vN` section to root `CHANGELOG.md`
4. Update `CLAUDE.md` reference if needed
5. Commit: `refactor(prompts): bump prompt version to vN`

### Updating code version (during build)

**Trigger**: After completing a build phase (PROMPT_X).

**Steps**:
1. Update `apps/*/package.json` version fields
2. Update root `package.json` if applicable
3. Add new section at top of `CHANGELOG.md`: `## [vX.Y.Z] — DATE`
4. Document Added/Changed/Removed/Fixed
5. Tag git: `git tag v0.X.0` then `git push --tags`
6. Commit: `chore(release): vX.Y.Z`

---

## 📋 Examples of correct versioning

### Example 1 — Adding a new module (Spec dimension)

You add Quality Hold management to the system.

- **Spec change**: New entities (LotHold, LotHoldAction), new ADR, new section in MASTER_SPEC
- **Action**: Bump spec from `v1.2` to `v1.3` (or include in `v2.0` if planning major release)
- **Prompt change**: PROMPT_2 (registries) might need update to include LotHold UI
- **Action**: Bump prompts to `v3.1` (minor) OR keep `v3` (if no breaking change)
- **Code change**: New service, new UI page, new tests
- **Action**: Bump code from `0.2.0` to `0.3.0` (new feature)

### Example 2 — Fixing a typo in MASTER_SPEC

You fix "Mold cyles" → "Mold cycles" in CFRP_MODULE.md.

- **Spec change**: Typo fix
- **Action**: NO version bump, just commit `docs: fix typo in CFRP_MODULE`
- **Prompt change**: None
- **Code change**: None

### Example 3 — Breaking API change

You change the WorkOrder release endpoint signature.

- **Spec change**: Update affected sections
- **Action**: Bump spec from `v1.2` to `v1.3` (clarification) OR `v2.0` (if multiple breaks)
- **Prompt change**: Affected prompt updated
- **Action**: Bump prompts version
- **Code change**: Backend + frontend updated
- **Action**: Bump code MAJOR (e.g., `1.0.0` → `2.0.0`) — this is breaking

---

## 🔄 Conventional commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) 
with these prefixes:

- `feat:` — New feature (code or spec)
- `fix:` — Bug fix
- `docs:` — Documentation only
- `refactor:` — Code/spec refactor (no functional change)
- `test:` — Test additions/changes
- `chore:` — Maintenance (versioning, deps, config)
- `style:` — Formatting only
- `perf:` — Performance improvement

### Scopes used in this project

- `feat(api)`, `feat(web)`, `feat(hmi)`, `feat(worker)` — Per-app features
- `feat(registries)`, `feat(workflow)`, `feat(autogen)` — Per-feature
- `docs(spec)`, `docs(prompt)` — Documentation type
- `refactor(prompts)` — Prompt restructuring
- `chore(release)` — Version bump + tag

### Examples

```bash
feat(api): add WorkOrderAssignment endpoints
feat(workflow): implement React Flow canvas
fix(autogen): handle split lots in BOM check
docs(spec): bump to v1.3 — add Quality Hold management
refactor(prompts): bump to v3 — CLAUDE.md auto-load pattern
chore(release): v0.2.0
```

---

## 🚦 Decision flowchart

When you're not sure if to bump a version, ask:

```
Did the change affect WHAT the system does (functional)?
├── YES
│   ├── Is it a breaking change?
│   │   ├── YES → Spec MAJOR bump (v1.2 → v2.0)
│   │   │        Code MAJOR bump (1.0.0 → 2.0.0)
│   │   └── NO  → Spec MINOR bump (v1.2 → v1.3)
│   │            Code MINOR bump (1.0.0 → 1.1.0)
│   └── (Always update CHANGELOG.md)
│
└── NO (typos, formatting, comments only)
    └── No version bump
        Just commit normally with descriptive message
```

For code:
```
What did you change?
├── New feature (backward-compat) → MINOR bump (1.X.0 → 1.(X+1).0)
├── Bug fix → PATCH bump (1.X.Y → 1.X.(Y+1))
├── Breaking change → MAJOR bump (1.X.Y → 2.0.0)
└── Internal refactor → No bump (just commit)
```

---

## 🎯 Why this matters for Claude Code

When Claude Code makes changes during build sessions, it should:

1. **Read CHANGELOG.md** to understand recent project history
2. **Read VERSIONING.md** (this file) to know the rules
3. **Suggest version bumps** when changes warrant them (in commit messages)
4. **NOT auto-commit** — version bumps are a human decision

When you commit Claude Code's work, you decide:
- Does this warrant a spec bump? (If yes, also update MASTER_SPEC header)
- Does this warrant a code bump? (If yes, update package.json + add tag)
- What CHANGELOG entry to add

This keeps versioning intentional, not automatic.

---

## 📚 References

- [Semantic Versioning 2.0.0](https://semver.org/) (basis for code versioning)
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) (basis for CHANGELOG.md format)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) (commit message format)

---

## 🔄 Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial versioning rules document. |
