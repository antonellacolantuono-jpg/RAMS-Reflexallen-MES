# Scripts — Workflow Automation v2.0

PowerShell scripts to streamline daily MES project operations.

## Files

- **setup-environment.ps1** v2 — One-time setup (folders, git aliases, VS Code, .gitignore)
- **update-docs.ps1** v2 — Smart sync of documentation from Downloads to repo
- **update.bat** — Double-click helper for `update-docs.ps1` (created by setup, optional)

---

## What's New in v2

The scripts now handle the **complete project structure**:

- ✅ `docs/extensions/` folder (modular extensions + workflows + mock data)
- ✅ All 24+ documentation files routed correctly
- ✅ Future prompts (PROMPT_3-6) recognized
- ✅ Better diff display in updates
- ✅ Smart "skip if identical" hash check

---

## Quick Start

### First time

From the project root (`C:\Users\antonella.colantuono.REFLEXALLEN\Desktop\RAMS_V4`):

```powershell
# Run setup once (configures folders, git aliases, VS Code, .gitignore)
.\scripts\setup-environment.ps1
```

This is **safe to run multiple times** — it only adds missing things.

### Daily workflow

When new versions of documentation files arrive in your Downloads:

1. **Download files** from the Claude chat to your Downloads folder
2. **Run update script**:
   ```powershell
   .\scripts\update-docs.ps1
   ```
   The script will:
   - Detect changed files (skips identical via SHA-256 hash)
   - Show summary of NEW vs MODIFIED vs SKIPPED
   - Auto-route each file to correct folder
   - Ask before applying changes
   - Ask before committing
   - Ask before pushing

### Faster: auto-commit mode

Skip all prompts:
```powershell
.\scripts\update-docs.ps1 -AutoCommit
```

### Preview without changes

```powershell
.\scripts\update-docs.ps1 -DryRun
```

### Custom source folder

```powershell
.\scripts\update-docs.ps1 -Source "D:\my-downloads"
```

### Update without push

```powershell
.\scripts\update-docs.ps1 -NoPush
```

### Custom commit message

```powershell
.\scripts\update-docs.ps1 -Message "docs: update master spec to v1.2"
```

---

## File Routing (COMPLETE)

The script auto-routes files based on filename. Here is the **complete routing table**:

### → `docs/` (Core Specifications, 3 files)

| File | Purpose |
|---|---|
| `MASTER_SPECIFICATION.md` | Domain entities, taxonomies, ADRs |
| `BEST_PRACTICES.md` | Implementation patterns |
| `CONVENTIONS.md` | Quick reference, naming, conventions |

### → `docs/extensions/` (Modular Extensions, 5 files)

| File | Purpose |
|---|---|
| `EQUIPMENT_MANAGEMENT.md` | Equipment State Machine, Maintenance, Tool Wear |
| `SCHEDULING_ASSIGNMENT.md` | WorkOrderAssignment, Skills coverage, Shifts |
| `INDUSTRIAL_OPERATIONS.md` | Multi-output, Continuous, Sample, FAI, WIP, Subassembly, Quality Hold |
| `CFRP_MODULE.md` | Mold cycles, Prepreg out-time, Cure cycles, NDT |
| `SAFETY_DEVICES_MODULE.md` | Reflectance ECE-R104, Homologation, Aging tests |

### → `docs/extensions/` (Workflow References, 8 files)

| File | Purpose |
|---|---|
| `WORKFLOW_PNEUMATIC_AIR.md` | High-level pneumatic tubes workflow |
| `WORKFLOW_PNEUMATIC_AIR_DETAILED.md` | Step-by-step with branching logic |
| `WORKFLOW_CFRP.md` | High-level CFRP workflow |
| `WORKFLOW_CFRP_DETAILED.md` | Step-by-step CFRP with branching |
| `WORKFLOW_SAFETY_DEVICES.md` | High-level Safety Devices workflow |
| `WORKFLOW_SAFETY_DEVICES_DETAILED.md` | Step-by-step Safety Devices |
| `WORKFLOW_FLUID_POWER.md` | INVENTED based on industry standards (V2) |
| `WORKFLOW_DIGITAL_ELECTRICAL.md` | INVENTED based on industry standards (V2) |

### → `docs/extensions/` (Inventory & Mock Data, up to 6 files)

| File | Purpose |
|---|---|
| `FUNCTIONAL_INVENTORY.md` | 227 features classified MVP/V2 |
| `MOCK_DATA_PNEUMATIC_AIR.md` | Concrete seed data for Pneumatic Air |
| `MOCK_DATA_CFRP.md` | (future) Concrete seed for CFRP |
| `MOCK_DATA_SAFETY_DEVICES.md` | (future) Concrete seed for Safety |
| `MOCK_DATA_FLUID_POWER.md` | (future, V2) |
| `MOCK_DATA_DIGITAL_ELECTRICAL.md` | (future, V2) |

### → `prompts/` (Build Prompts for Claude Code, up to 7 files)

| File | Purpose |
|---|---|
| `MASTER_PROMPT.md` | Onboarding context for Claude Code |
| `PROMPT_1_FOUNDATION.md` | Step 1: monorepo + Docker + Prisma schema |
| `PROMPT_2_REGISTRIES.md` | Step 2: 13 registries + seed data + audit |
| `PROMPT_3_WORKFLOW_DESIGNER.md` | (future) Step 3: canvas + 4-pane configurator |
| `PROMPT_4_AUTO_GENERATION.md` | (future) Step 4: auto-gen engine 7 rules |
| `PROMPT_5_EXECUTION_HMI.md` | (future) Step 5: HMI shop floor |
| `PROMPT_6_DASHBOARD_REPORTING.md` | (future) Step 6: OEE, FPY, KPI |

### → `scripts/` (Automation, 3 files)

| File | Purpose |
|---|---|
| `setup-environment.ps1` | One-time environment setup |
| `update-docs.ps1` | Daily docs sync |
| `sync-from-downloads.ps1` | (alias) Same as update-docs |

### Files INTENTIONALLY ignored

- `README.md` — Ambiguous (root vs scripts vs others). Place manually.
- Any other `.md` not matching a known pattern → ignored

---

## Git Aliases (configured by setup)

| Alias | Command | Purpose |
|---|---|---|
| `git st` | `status -sb` | Compact status |
| `git lg` | Pretty log graph | Last 20 commits visualized |
| `git co` | `checkout` | Quick branch switch |
| `git br` | `branch` | List branches |
| `git ci` | `commit` | Quick commit |
| `git df` | `diff` | Unstaged changes |
| `git dfs` | `diff --staged` | Staged changes |
| `git last` | `log -1 HEAD` | Last commit details |
| `git amend` | `commit --amend --no-edit` | Add to last commit |
| `git undo` | `reset HEAD~1 --soft` | Undo last commit (keep changes) |
| `git wip` | Quick WIP commit | Temporary checkpoint |
| `git docupdate` | Add+commit+push docs/prompts | Fast docs sync |
| `git ms` | Compact status + recent commits | Mini status |

---

## Troubleshooting

### "Execution policy" error

If PowerShell blocks the script:
```powershell
# Run as Administrator, one-time
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or run with bypass:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-docs.ps1
```

### "Not in a git repository"

Make sure you're in the project root:
```powershell
cd "C:\Users\antonella.colantuono.REFLEXALLEN\Desktop\RAMS_V4"
```

### "git push failed"

Most common cause: authentication. Solutions:
- Configure GitHub Personal Access Token
- Or install GitHub CLI: `gh auth login`

### Script can't find files

Check your Downloads folder:
```powershell
dir $env:USERPROFILE\Downloads\*.md
```

If files are elsewhere:
```powershell
.\scripts\update-docs.ps1 -Source "D:\path\to\folder"
```

### File name not recognized

The script uses **exact filename matching** (case-sensitive). Common issues:
- Browser may add suffixes: `MASTER_SPECIFICATION (1).md` → renamed required
- Use the script's "expected file names" list when no candidates found

### Hash mismatch but file looks identical

The script uses SHA-256 hash. If you edited the file locally and want to overwrite with downloaded version, the hash will differ — that's intentional. Choose YES to update.

---

## Examples

### Scenario 1: Got new BEST_PRACTICES.md from chat

```powershell
# Download from chat to ~\Downloads
# Then:
.\scripts\update-docs.ps1
# Confirm prompts → done in 30 seconds
```

### Scenario 2: Multiple new prompts at once

```powershell
# Download PROMPT_3, PROMPT_4, PROMPT_5 to Downloads
# Then:
.\scripts\update-docs.ps1 -AutoCommit
# All committed and pushed automatically
```

### Scenario 3: Just want to see what would change

```powershell
.\scripts\update-docs.ps1 -DryRun
# Shows what's new/changed, no actual changes
```

### Scenario 4: Commit but don't push yet

```powershell
.\scripts\update-docs.ps1 -NoPush
# Commit happens, push manual: git push origin main
```

### Scenario 5: Got CFRP_MODULE.md and 3 workflow files

```powershell
# Download to ~\Downloads
.\scripts\update-docs.ps1
# Output shows:
#   ~ CFRP_MODULE.md → docs/extensions/
#   ~ WORKFLOW_CFRP_DETAILED.md → docs/extensions/
#   + WORKFLOW_PNEUMATIC_AIR_DETAILED.md → docs/extensions/
# Confirms and syncs all to docs/extensions/
```

---

## What NOT to do

- ❌ Don't manually copy files to `docs/` if you can use the script
- ❌ Don't commit without verifying changes (`git df` first if unsure)
- ❌ Don't push to `main` directly without testing
- ❌ Don't store sensitive data in `docs/` or `prompts/` (they're committed publicly)
- ❌ Don't rename files that the script knows (it won't recognize them)

---

## Maintenance

- Scripts are version-controlled with the project
- If you modify them, commit the changes
- Add new file routes by editing `$FileRoutingRules` in `update-docs.ps1`
- Add new git aliases by editing `setup-environment.ps1` and re-running

---

## Version History

### v2.0 (2026-04-27)
- Complete file routing table (24+ patterns)
- Added `docs/extensions/` folder support
- Added workflow files routing (8 files)
- Added mock data files routing (up to 6 files)
- Added future prompt files routing (PROMPT_3-6)
- Improved diff display (NEW vs MODIFIED vs SKIPPED)
- Hash-based "identical file" detection
- Better commit messages with file list
- Idempotent setup with verification step

### v1.0 (earlier)
- Basic 5-file routing (specs + prompts only)
- Simple git aliases
- VS Code extensions config
