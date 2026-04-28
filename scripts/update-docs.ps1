# update-docs.ps1 v2.0
#
# Smart sync of MES documentation files from Downloads to repo.
# Auto-routes each file to the correct folder based on filename.
#
# What's NEW in v2:
#   - Routes 24+ files (was 5)
#   - Handles docs/extensions/ folder (5 modular extensions + 8 workflows + 2 misc)
#   - Handles MOCK_DATA_*.md files
#   - Handles future PROMPT_3-6 files
#   - Better diff display
#   - Smarter "skip if identical" logic
#
# Usage:
#   .\scripts\update-docs.ps1                          # Interactive (default)
#   .\scripts\update-docs.ps1 -AutoCommit              # Skip prompts, auto commit + push
#   .\scripts\update-docs.ps1 -Source "D:\my-folder"   # Custom source folder
#   .\scripts\update-docs.ps1 -DryRun                  # Preview only, no changes
#   .\scripts\update-docs.ps1 -NoPush                  # Commit but don't push
#   .\scripts\update-docs.ps1 -Message "custom msg"    # Custom commit message

param(
    [string]$Source = "$env:USERPROFILE\Downloads",
    [switch]$AutoCommit,
    [switch]$DryRun,
    [switch]$NoPush,
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

# === Colors ===
$Red    = "Red"
$Green  = "Green"
$Yellow = "Yellow"
$Cyan   = "Cyan"
$Gray   = "Gray"
$White  = "White"

# === Helpers ===
function Write-Header($text) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor $Cyan
    Write-Host "  $text" -ForegroundColor $Cyan
    Write-Host ("=" * 60) -ForegroundColor $Cyan
    Write-Host ""
}

function Write-Step($text)    { Write-Host "→ $text" -ForegroundColor $White }
function Write-Success($text) { Write-Host "✓ $text" -ForegroundColor $Green }
function Write-Warn($text)    { Write-Host "⚠ $text" -ForegroundColor $Yellow }
function Write-Error2($text)  { Write-Host "✗ $text" -ForegroundColor $Red }
function Write-Info($text)    { Write-Host "  $text" -ForegroundColor $Gray }

function Confirm-Action($prompt, $default = "n") {
    $hint = if ($default -eq "y") { "(Y/n)" } else { "(y/N)" }
    $response = Read-Host "$prompt $hint"
    if ([string]::IsNullOrWhiteSpace($response)) { $response = $default }
    return $response -match '^[yY]'
}

function Test-FilesIdentical($path1, $path2) {
    if (-not (Test-Path $path1) -or -not (Test-Path $path2)) { return $false }
    $h1 = (Get-FileHash -Path $path1 -Algorithm SHA256).Hash
    $h2 = (Get-FileHash -Path $path2 -Algorithm SHA256).Hash
    return $h1 -eq $h2
}

function Get-FileSize($path) {
    if (-not (Test-Path $path)) { return "?" }
    $bytes = (Get-Item $path).Length
    if ($bytes -lt 1KB)     { return "$bytes B" }
    elseif ($bytes -lt 1MB) { return "{0:N1} KB" -f ($bytes / 1KB) }
    else                    { return "{0:N1} MB" -f ($bytes / 1MB) }
}

# === Configuration: COMPLETE FILE ROUTING ===
# Maps filename to destination folder (relative to repo root)

$FileRoutingRules = @{
    # ──────────── TIER 1: Core Specifications → docs/ ────────────
    "MASTER_SPECIFICATION.md"             = "docs"
    "BEST_PRACTICES.md"                   = "docs"
    "CONVENTIONS.md"                      = "docs"
    
    # ──────────── TIER 2: Modular Extensions → docs/extensions/ ────────────
    "EQUIPMENT_MANAGEMENT.md"             = "docs/extensions"
    "SCHEDULING_ASSIGNMENT.md"            = "docs/extensions"
    "INDUSTRIAL_OPERATIONS.md"            = "docs/extensions"
    "CFRP_MODULE.md"                      = "docs/extensions"
    "SAFETY_DEVICES_MODULE.md"            = "docs/extensions"
    
    # ──────────── TIER 3: Workflow References → docs/extensions/ ────────────
    "WORKFLOW_PNEUMATIC_AIR.md"           = "docs/extensions"
    "WORKFLOW_PNEUMATIC_AIR_DETAILED.md"  = "docs/extensions"
    "WORKFLOW_CFRP.md"                    = "docs/extensions"
    "WORKFLOW_CFRP_DETAILED.md"           = "docs/extensions"
    "WORKFLOW_SAFETY_DEVICES.md"          = "docs/extensions"
    "WORKFLOW_SAFETY_DEVICES_DETAILED.md" = "docs/extensions"
    "WORKFLOW_FLUID_POWER.md"             = "docs/extensions"
    "WORKFLOW_DIGITAL_ELECTRICAL.md"      = "docs/extensions"
    
    # ──────────── TIER 4: Inventory & Mock Data → docs/extensions/ ────────────
    "FUNCTIONAL_INVENTORY.md"             = "docs/extensions"
    "MOCK_DATA_PNEUMATIC_AIR.md"          = "docs/extensions"
    "MOCK_DATA_CFRP.md"                   = "docs/extensions"
    "MOCK_DATA_SAFETY_DEVICES.md"         = "docs/extensions"
    "MOCK_DATA_FLUID_POWER.md"            = "docs/extensions"
    "MOCK_DATA_DIGITAL_ELECTRICAL.md"     = "docs/extensions"
    
    # ──────────── BUILD PROMPTS → prompts/ ────────────
    "MASTER_PROMPT.md"                    = "prompts"
    "PROMPT_1_FOUNDATION.md"              = "prompts"
    "PROMPT_2_REGISTRIES.md"              = "prompts"
    "PROMPT_3_WORKFLOW_DESIGNER.md"       = "prompts"
    "PROMPT_4_AUTO_GENERATION.md"         = "prompts"
    "PROMPT_5_EXECUTION_HMI.md"           = "prompts"
    "PROMPT_6_DASHBOARD_REPORTING.md"     = "prompts"
    
    # ──────────── AUTOMATION SCRIPTS → scripts/ ────────────
    "setup-environment.ps1"               = "scripts"
    "update-docs.ps1"                     = "scripts"
    "sync-from-downloads.ps1"             = "scripts"
}

# Note: README.md is intentionally NOT in routing rules.
# README.md is ambiguous (root vs scripts vs docs).
# If you need to update README.md, do it manually OR rename the file 
# to be more specific (e.g., SCRIPTS_README.md, ROOT_README.md).

# === Pre-flight checks ===
Write-Header "MES Documentation Sync v2.0"

if ($DryRun) {
    Write-Warn "DRY RUN MODE - no files will be modified"
}

# Repo root check
$repoRoot = (Get-Location).Path
if (-not (Test-Path "$repoRoot\.git")) {
    Write-Error2 "Not in a git repository: $repoRoot"
    Write-Info "Make sure you're in the repo root directory."
    exit 1
}

# Source folder check
if (-not (Test-Path $Source)) {
    Write-Error2 "Source folder not found: $Source"
    exit 1
}

Write-Info "Repo root:  $repoRoot"
Write-Info "Source:     $Source"
Write-Info "Routing:    $($FileRoutingRules.Count) file patterns recognized"
Write-Host ""

# === Step 1: Scan source folder ===
Write-Header "Step 1: Scanning source folder"

$candidates = @()
foreach ($fileName in $FileRoutingRules.Keys) {
    $sourcePath = Join-Path $Source $fileName
    if (Test-Path $sourcePath) {
        $destFolder = $FileRoutingRules[$fileName]
        $destPath = Join-Path $repoRoot (Join-Path $destFolder $fileName)
        $candidates += [PSCustomObject]@{
            Name = $fileName
            SourcePath = $sourcePath
            DestFolder = $destFolder
            DestPath = $destPath
            Size = Get-FileSize $sourcePath
        }
    }
}

if ($candidates.Count -eq 0) {
    Write-Warn "No matching MES doc files found in: $Source"
    Write-Info ""
    Write-Info "Expected file names (case-sensitive):"
    foreach ($name in ($FileRoutingRules.Keys | Sort-Object)) {
        Write-Info "  $name"
    }
    exit 0
}

Write-Success "Found $($candidates.Count) candidate file(s)"
foreach ($c in $candidates) {
    Write-Info "  $($c.Name) ($($c.Size)) → $($c.DestFolder)/"
}

# === Step 2: Categorize ===
Write-Header "Step 2: Comparing with existing files"

$toCreate = @()
$toUpdate = @()
$toSkip   = @()

foreach ($c in $candidates) {
    if (Test-Path $c.DestPath) {
        if (Test-FilesIdentical $c.SourcePath $c.DestPath) {
            $toSkip += $c
        } else {
            $toUpdate += $c
        }
    } else {
        $toCreate += $c
    }
}

Write-Info "  New (to create):       $($toCreate.Count)"
Write-Info "  Modified (to update):  $($toUpdate.Count)"
Write-Info "  Identical (skip):      $($toSkip.Count)"

if ($toCreate.Count -eq 0 -and $toUpdate.Count -eq 0) {
    Write-Header "Nothing to do"
    Write-Success "All files are already up to date in the repo."
    exit 0
}

# === Step 3: Show plan ===
Write-Header "Step 3: Sync plan"

if ($toCreate.Count -gt 0) {
    Write-Host "  NEW files (create):" -ForegroundColor $Green
    foreach ($f in $toCreate) {
        Write-Host "    + $($f.Name)  →  $($f.DestFolder)/" -ForegroundColor $Green
    }
}

if ($toUpdate.Count -gt 0) {
    Write-Host ""
    Write-Host "  MODIFIED files (update):" -ForegroundColor $Yellow
    foreach ($f in $toUpdate) {
        Write-Host "    ~ $($f.Name)  →  $($f.DestFolder)/" -ForegroundColor $Yellow
    }
}

if ($toSkip.Count -gt 0) {
    Write-Host ""
    Write-Host "  IDENTICAL files (skipped):" -ForegroundColor $Gray
    foreach ($f in $toSkip) {
        Write-Host "    = $($f.Name)" -ForegroundColor $Gray
    }
}

if ($DryRun) {
    Write-Header "DRY RUN - no changes made"
    exit 0
}

if (-not $AutoCommit) {
    Write-Host ""
    if (-not (Confirm-Action "Proceed with sync?" "y")) {
        Write-Warn "Aborted by user"
        exit 0
    }
}

# === Step 4: Sync files ===
Write-Header "Step 4: Syncing files"

$syncedFiles = @()

foreach ($c in ($toCreate + $toUpdate)) {
    # Ensure destination folder exists
    $destFolderFull = Join-Path $repoRoot $c.DestFolder
    if (-not (Test-Path $destFolderFull)) {
        New-Item -ItemType Directory -Path $destFolderFull -Force | Out-Null
        Write-Info "Created folder: $($c.DestFolder)/"
    }
    
    try {
        Copy-Item -Path $c.SourcePath -Destination $c.DestPath -Force
        Write-Success "Synced: $($c.Name) → $($c.DestFolder)/"
        $syncedFiles += "$($c.DestFolder)/$($c.Name)"
    } catch {
        Write-Error2 "Failed to sync $($c.Name): $_"
    }
}

if ($syncedFiles.Count -eq 0) {
    Write-Warn "No files were synced successfully."
    exit 1
}

# === Step 5: Git operations ===
Write-Header "Step 5: Git operations"

# Check git status
$gitStatus = git status --porcelain 2>&1
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Warn "No git changes detected (files might be identical despite hash check)"
    exit 0
}

Write-Info "Changed files in git:"
git status --short

Write-Host ""
$shouldCommit = $AutoCommit -or (Confirm-Action "Commit these changes?" "y")
if (-not $shouldCommit) {
    Write-Info "Files synced but not committed. Use 'git status' to review."
    exit 0
}

# Build commit message
if ([string]::IsNullOrWhiteSpace($Message)) {
    $createCount = $toCreate.Count
    $updateCount = $toUpdate.Count
    
    if ($createCount -gt 0 -and $updateCount -gt 0) {
        $Message = "docs: add $createCount new + update $updateCount file(s)"
    } elseif ($createCount -gt 0) {
        $Message = "docs: add $createCount new file(s)"
    } else {
        $Message = "docs: update $updateCount file(s)"
    }
    
    # Add file list to commit body
    $fileList = ($syncedFiles | ForEach-Object { "  - $_" }) -join "`n"
    $Message = "$Message`n`nFiles synced:`n$fileList"
}

# Stage and commit
try {
    foreach ($f in $syncedFiles) {
        git add $f 2>&1 | Out-Null
    }
    
    git commit -m $Message 2>&1 | Out-Null
    Write-Success "Committed: $Message"
} catch {
    Write-Error2 "Commit failed: $_"
    exit 1
}

# === Step 6: Push ===
if ($NoPush) {
    Write-Info "Skipping push (--NoPush specified)"
    Write-Info "Run 'git push' manually when ready."
    exit 0
}

if (-not $AutoCommit) {
    Write-Host ""
    $shouldPush = Confirm-Action "Push to remote?" "y"
    if (-not $shouldPush) {
        Write-Info "Committed but not pushed. Use 'git push' when ready."
        exit 0
    }
}

try {
    git push 2>&1 | ForEach-Object { Write-Info $_ }
    Write-Success "Pushed to remote"
} catch {
    Write-Warn "Push failed (you may need to authenticate): $_"
    Write-Info "Run 'git push' manually."
    exit 1
}

Write-Header "Sync complete!"
Write-Success "$($syncedFiles.Count) file(s) synced and pushed."
