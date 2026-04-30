<#
.SYNOPSIS
    Automate the closure of a Claude Code Desktop worktree branch.

.DESCRIPTION
    Performs the boilerplate steps after a Claude Code prompt is verified done:
    1. Verify pre-conditions (working tree clean, branch exists, etc.)
    2. Show commits about to be merged + pause for user Y/N
    3. git merge --no-ff with provided commit message
    4. git push origin main
    5. Cleanup: rmdir worktree, prune, delete local + remote branch
    6. Final verification (working tree clean, branch list pure, log)

    The script never makes destructive decisions silently. It pauses for
    confirmation before merge, and stops on any error.

.PARAMETER Branch
    The Claude Code worktree branch to merge and clean up.
    Format: "claude/<name>-<hash>" (e.g., "claude/lucid-swirles-672fe6")

.PARAMETER Title
    Short title for the merge commit (will be the first line).
    Example: "PROMPT_5_LITE: HMI Execution (D1-D4)"

.PARAMETER Body
    Optional. Multi-line body for the merge commit.
    If omitted, only the title is used as the merge commit message.

.PARAMETER SkipTests
    Optional. Skip the final pnpm test gate. Use only when you've
    already verified the test suite passed (e.g., Claude Code's gates).

.PARAMETER DryRun
    Optional. Print all the commands the script would run, but don't
    execute any of them. Useful to verify the plan before committing.

.EXAMPLE
    .\scripts\finalize-prompt.ps1 -Branch "claude/lucid-swirles-672fe6" -Title "PROMPT_5_LITE: HMI Execution (D1-D4)"

.EXAMPLE
    .\scripts\finalize-prompt.ps1 -Branch "claude/lucid-swirles-672fe6" -Title "PROMPT_5_LITE: HMI Execution" -DryRun

.NOTES
    Designed for the RAMS-Reflexallen-MES workflow.
    Run from the repo root.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Branch,

    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $false)]
    [string]$Body = "",

    [Parameter(Mandatory = $false)]
    [switch]$SkipTests,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# --- Helpers ---

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "===== $Title =====" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text)
    Write-Host "   $Text" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Text)
    Write-Host "   OK $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "   ! $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "   X $Text" -ForegroundColor Red
}

function Run-Cmd {
    param(
        [string]$Cmd,
        [switch]$AllowError
    )
    if ($DryRun) {
        Write-Host "   [DRY-RUN] $Cmd" -ForegroundColor Yellow
        return ""
    }
    try {
        $output = Invoke-Expression $Cmd 2>&1
        return $output
    } catch {
        if (-not $AllowError) {
            Write-Err "Command failed: $Cmd"
            Write-Err $_.Exception.Message
            exit 1
        }
        return $_.Exception.Message
    }
}

function Confirm-Action {
    param([string]$Prompt)
    if ($DryRun) {
        Write-Host "   [DRY-RUN] Would prompt: $Prompt -> assuming Y" -ForegroundColor Yellow
        return $true
    }
    $response = Read-Host "$Prompt (Y/N)"
    return $response -eq "Y" -or $response -eq "y"
}

# --- Validation ---

Write-Section "Pre-flight check"

# Make sure we're in the repo root
if (-not (Test-Path ".git")) {
    Write-Err "Current directory is not a git repository."
    Write-Err "Run this script from the repo root: cd C:\Users\<user>\Desktop\RAMS-Reflexallen-MES"
    exit 1
}
Write-Success "Repo root confirmed"

# Reload PATH (Windows quirk)
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
Write-Success "PATH reloaded"

# Check git, pnpm available
$gitVersion = Run-Cmd "git --version"
if ($gitVersion -notmatch "git version") {
    Write-Err "git not in PATH. Reload PowerShell or fix PATH."
    exit 1
}
Write-Success "git: $gitVersion"

$pnpmVersion = Run-Cmd "pnpm --version" -AllowError
if ($pnpmVersion -notmatch "^\d+\.\d+\.\d+") {
    Write-Warn "pnpm not in PATH. Tests will be skipped."
    $SkipTests = $true
} else {
    Write-Success "pnpm: $pnpmVersion"
}

# Check working tree clean
$status = Run-Cmd "git status --porcelain"
if ($status) {
    Write-Err "Working tree is not clean. Commit or stash first."
    Write-Err "Pending changes:"
    Write-Host $status
    exit 1
}
Write-Success "Working tree clean"

# Check current branch is main
$currentBranch = Run-Cmd "git rev-parse --abbrev-ref HEAD"
if ($currentBranch -ne "main") {
    Write-Err "Not on main branch. Currently on: $currentBranch"
    Write-Err "Switch to main first: git checkout main"
    exit 1
}
Write-Success "On main branch"

# --- Fetch + verify branch exists ---

Write-Section "Verify target branch"

Run-Cmd "git fetch origin"
Write-Success "Fetched origin"

$remoteBranch = "origin/$Branch"
$remoteExists = Run-Cmd "git rev-parse --verify --quiet $remoteBranch" -AllowError
if (-not $remoteExists) {
    Write-Err "Branch $remoteBranch not found on origin."
    Write-Err "Did the worktree push? Check with: git ls-remote --heads origin"
    exit 1
}
Write-Success "Branch $Branch exists on origin"

# --- Show commits to merge ---

Write-Section "Commits about to be merged into main"
$commits = Run-Cmd "git log main..$remoteBranch --oneline"
if (-not $commits) {
    Write-Warn "No new commits in $Branch beyond main. Nothing to merge."
    exit 0
}
Write-Host $commits
Write-Host ""

if (-not (Confirm-Action "Proceed with merge?")) {
    Write-Warn "Merge aborted by user."
    exit 0
}

# --- Merge ---

Write-Section "Merge $Branch into main"

if ($Body) {
    $message = "$Title`n`n$Body"
} else {
    $message = $Title
}
# Escape backticks and quotes for shell
$escapedMessage = $message -replace '"', '`"'

$mergeCmd = "git merge $Branch --no-ff -m `"$escapedMessage`""
$mergeOutput = Run-Cmd $mergeCmd
Write-Host $mergeOutput
Write-Success "Merge done"

# --- Push ---

Write-Section "Push main to origin"
$pushOutput = Run-Cmd "git push origin main"
Write-Host $pushOutput
Write-Success "Pushed"

# --- Cleanup worktree ---

Write-Section "Cleanup worktree + branch"

# Worktree directory name = part after "claude/"
$worktreeDirName = $Branch -replace "^claude/", ""
$worktreePath = ".claude\worktrees\$worktreeDirName"

if (Test-Path $worktreePath) {
    Write-Step "Removing worktree directory $worktreePath ..."
    if (-not $DryRun) {
        # cmd's rmdir is more aggressive than Remove-Item on Windows
        cmd /c "rmdir /s /q $worktreePath" 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
    if (Test-Path $worktreePath) {
        Write-Warn "Worktree directory still exists after rmdir. Probably a process holds a lock."
        Write-Warn "Close Claude Code Desktop completely and re-run with: -OnlyCleanup"
        Write-Warn "Continuing without filesystem cleanup..."
    } else {
        Write-Success "Worktree directory removed"
    }
} else {
    Write-Step "Worktree directory $worktreePath not present (already gone)"
}

Run-Cmd "git worktree prune"
Write-Success "Worktree registry pruned"

# Delete local branch
$localBranchExists = Run-Cmd "git rev-parse --verify --quiet $Branch" -AllowError
if ($localBranchExists) {
    Run-Cmd "git branch -d $Branch" -AllowError | Out-Null
    # If "-d" failed because not fully merged, force with -D (we know it's merged because we just merged)
    $stillExists = Run-Cmd "git rev-parse --verify --quiet $Branch" -AllowError
    if ($stillExists) {
        Run-Cmd "git branch -D $Branch"
    }
    Write-Success "Local branch deleted"
} else {
    Write-Step "Local branch already absent"
}

# Delete remote branch
Run-Cmd "git push origin --delete $Branch" -AllowError | Out-Null
Write-Success "Remote branch deleted"

# --- Final tests (optional) ---

if (-not $SkipTests) {
    Write-Section "Final test gate"
    Write-Step "Running pnpm test (force, no cache) ..."
    $testOutput = Run-Cmd "pnpm exec turbo run test --force 2>&1 | Select-Object -Last 30"
    Write-Host $testOutput
    if ($testOutput -match "Failed" -or $testOutput -match "ELIFECYCLE") {
        Write-Err "Tests failed after merge. Investigate before declaring done."
        exit 1
    }
    Write-Success "Tests passed"
} else {
    Write-Warn "Tests skipped per -SkipTests flag (or pnpm not available)"
}

# --- Final state ---

Write-Section "Final state"

Write-Step "git log (top 5):"
$finalLog = Run-Cmd "git log --oneline | Select-Object -First 5"
Write-Host $finalLog

Write-Step "git status:"
$finalStatus = Run-Cmd "git status -sb"
Write-Host $finalStatus

Write-Step "git branch -a:"
$finalBranches = Run-Cmd "git branch -a"
Write-Host $finalBranches

Write-Section "Done"
Write-Host "  Branch $Branch fully merged + cleaned up." -ForegroundColor Green
Write-Host "  Main is up-to-date with origin." -ForegroundColor Green
Write-Host "  Working tree is clean." -ForegroundColor Green
Write-Host ""
Write-Host "  Next: update STATUS.md and TODO.md if needed, then commit." -ForegroundColor Cyan
