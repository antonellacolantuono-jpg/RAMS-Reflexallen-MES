# setup-environment.ps1 v2.0
#
# One-time setup of the MES project workflow environment.
# Idempotent — safe to run multiple times.
#
# What's NEW in v2:
#   - Creates docs/extensions/ folder (was missing)
#   - Updates git aliases for new folder structure
#   - Adds README.md check at root
#   - Better verification at the end
#
# Configures:
#   - Folder structure (docs/, docs/extensions/, prompts/, scripts/)
#   - Git aliases for daily workflow
#   - VS Code recommended extensions list (optional)
#   - .gitignore additions for OS files
#
# Usage:
#   .\scripts\setup-environment.ps1              # Default: ask before changes
#   .\scripts\setup-environment.ps1 -Force       # Skip prompts, apply all

param(
    [switch]$Force
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

function Confirm-Action($prompt) {
    if ($Force) { return $true }
    $response = Read-Host "$prompt (y/n)"
    return $response -match '^[yY]'
}

# === Pre-flight ===
Write-Header "MES Project Environment Setup v2.0"

$repoRoot = (Get-Location).Path

if (-not (Test-Path "$repoRoot\.git")) {
    Write-Error2 "Not in a git repository: $repoRoot"
    Write-Info "Run this from the repo root, e.g.:"
    Write-Info "  cd C:\Users\antonella.colantuono.REFLEXALLEN\Desktop\RAMS_V4"
    Write-Info "  .\scripts\setup-environment.ps1"
    exit 1
}

Write-Info "Repo root: $repoRoot"

# === Step 1: Folder structure ===
Write-Header "Step 1: Folder structure"

$folders = @(
    "docs",
    "docs/extensions",   # NEW in v2
    "prompts",
    "scripts"
)

foreach ($folder in $folders) {
    $path = Join-Path $repoRoot $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Success "Created: $folder/"
    } else {
        Write-Info "Exists:  $folder/"
    }
}

# === Step 2: Git aliases ===
Write-Header "Step 2: Git aliases"

$aliases = @{
    "st"        = "status -sb"
    "lg"        = "log --graph --pretty=format:'%C(yellow)%h%Creset %C(cyan)%ad%Creset %C(white)%s%Creset %C(green)(%an)%Creset%C(red)%d%Creset' --abbrev-commit --date=short -20"
    "co"        = "checkout"
    "br"        = "branch"
    "ci"        = "commit"
    "df"        = "diff"
    "dfs"       = "diff --staged"
    "last"      = "log -1 HEAD"
    "amend"     = "commit --amend --no-edit"
    "undo"      = "reset HEAD~1 --soft"
    "wip"       = "!git add -A && git commit -m 'WIP: checkpoint'"
    "docupdate" = "!f() { git add docs/ prompts/ && git commit -m `"docs: update reference documents and prompts`" && git push origin HEAD; }; f"
    "ms"        = "!f() { git status -sb && echo '' && git log --oneline -5; }; f"
}

$aliasCount = 0
foreach ($name in $aliases.Keys) {
    $value = $aliases[$name]
    $existing = git config --global --get "alias.$name" 2>$null
    
    if ($existing -ne $value) {
        try {
            git config --global "alias.$name" $value
            Write-Success "Set alias: git $name"
            $aliasCount++
        } catch {
            Write-Warn "Failed to set alias $name"
        }
    } else {
        Write-Info "Already set: git $name"
    }
}

if ($aliasCount -gt 0) {
    Write-Success "Configured $aliasCount git alias(es)"
}

# === Step 3: .gitignore additions ===
Write-Header "Step 3: .gitignore"

$gitignorePath = Join-Path $repoRoot ".gitignore"
$gitignoreAdditions = @"

# === MES Project ===
# OS files
.DS_Store
Thumbs.db
*.swp

# IDE files
.vscode/settings.json
.idea/

# Environment
.env
.env.local
.env.*.local

# Build artifacts
dist/
build/
.turbo/
.next/
node_modules/

# Logs
*.log
npm-debug.log*

# Prisma
prisma/migrations/dev.db*
*.db

# Test coverage
coverage/
.nyc_output/

# OS backup files
*~
*.bak
"@

if (Test-Path $gitignorePath) {
    $existing = Get-Content $gitignorePath -Raw
    if ($existing -notmatch "MES Project") {
        Add-Content -Path $gitignorePath -Value $gitignoreAdditions
        Write-Success "Updated .gitignore with project-specific rules"
    } else {
        Write-Info ".gitignore already has project rules"
    }
} else {
    Set-Content -Path $gitignorePath -Value $gitignoreAdditions
    Write-Success "Created .gitignore"
}

# === Step 4: VS Code extensions (optional) ===
Write-Header "Step 4: VS Code recommended extensions"

if (-not $Force) {
    $shouldCreate = Confirm-Action "Create .vscode/extensions.json with recommended extensions?"
} else {
    $shouldCreate = $true
}

if ($shouldCreate) {
    $vscodeFolder = Join-Path $repoRoot ".vscode"
    if (-not (Test-Path $vscodeFolder)) {
        New-Item -ItemType Directory -Path $vscodeFolder -Force | Out-Null
    }
    
    $extensionsPath = Join-Path $vscodeFolder "extensions.json"
    if (-not (Test-Path $extensionsPath) -or $Force) {
        $extensions = @{
            recommendations = @(
                "dbaeumer.vscode-eslint",
                "esbenp.prettier-vscode",
                "prisma.prisma",
                "bradlc.vscode-tailwindcss",
                "ms-vscode.vscode-typescript-next",
                "yoavbls.pretty-ts-errors",
                "GitHub.copilot",
                "GitHub.copilot-chat",
                "ms-azuretools.vscode-docker",
                "redhat.vscode-yaml",
                "yzhang.markdown-all-in-one",
                "DavidAnson.vscode-markdownlint",
                "stivo.tailwind-fold"
            )
        } | ConvertTo-Json -Depth 5
        
        $extensions | Out-File -FilePath $extensionsPath -Encoding UTF8 -Force
        Write-Success "Created: .vscode/extensions.json"
        Write-Info "Open VS Code in this folder and install recommended extensions"
    } else {
        Write-Info ".vscode/extensions.json already exists"
    }
} else {
    Write-Info "Skipped VS Code extensions"
}

# === Step 5: Verify root README ===
Write-Header "Step 5: Root README check"

$rootReadme = Join-Path $repoRoot "README.md"
if (-not (Test-Path $rootReadme)) {
    Write-Warn "Root README.md missing"
    Write-Info "Recommended: download README.md from latest sync and place at repo root"
    Write-Info "It documents the project structure, how to use, etc."
} else {
    $size = (Get-Item $rootReadme).Length
    if ($size -lt 500) {
        Write-Warn "Root README.md exists but is very small ($size bytes)"
        Write-Info "Consider updating it with the latest version"
    } else {
        Write-Success "Root README.md exists ($([math]::Round($size/1KB, 1)) KB)"
    }
}

# === Step 6: Verify documentation folders ===
Write-Header "Step 6: Documentation status"

$docCount = (Get-ChildItem "docs" -Filter "*.md" -ErrorAction SilentlyContinue).Count
$extCount = (Get-ChildItem "docs/extensions" -Filter "*.md" -ErrorAction SilentlyContinue).Count
$promptCount = (Get-ChildItem "prompts" -Filter "*.md" -ErrorAction SilentlyContinue).Count
$scriptCount = (Get-ChildItem "scripts" -Filter "*.ps1" -ErrorAction SilentlyContinue).Count

Write-Info "docs/             : $docCount markdown file(s) (expected: 3)"
Write-Info "docs/extensions/  : $extCount markdown file(s) (expected: ~15)"
Write-Info "prompts/          : $promptCount prompt file(s) (expected: 3-7)"
Write-Info "scripts/          : $scriptCount PowerShell script(s) (expected: 2-3)"

if ($docCount -lt 3) {
    Write-Warn "docs/ is missing files. Download MASTER_SPECIFICATION.md, BEST_PRACTICES.md, CONVENTIONS.md"
}
if ($extCount -lt 5) {
    Write-Warn "docs/extensions/ is missing files. Run update-docs.ps1 after downloading"
}

# === Summary ===
Write-Header "Setup complete!"

Write-Host "  Folder structure:" -ForegroundColor $Green
Write-Host "    ✓ docs/ (core specifications)" -ForegroundColor $Green
Write-Host "    ✓ docs/extensions/ (modular extensions, workflows, mock data)" -ForegroundColor $Green
Write-Host "    ✓ prompts/ (build prompts for Claude Code)" -ForegroundColor $Green
Write-Host "    ✓ scripts/ (automation)" -ForegroundColor $Green
Write-Host ""
Write-Host "  Git aliases configured" -ForegroundColor $Green
Write-Host "  .gitignore updated" -ForegroundColor $Green
if ($shouldCreate) {
    Write-Host "  VS Code extensions list ready" -ForegroundColor $Green
}
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor $White
Write-Host "    1. Download files from chat to ~/Downloads/" -ForegroundColor $White
Write-Host "    2. Run: .\scripts\update-docs.ps1" -ForegroundColor $White
Write-Host "    3. Files will auto-route to correct folders" -ForegroundColor $White
Write-Host "    4. Use git aliases: git st, git lg, git docupdate, etc." -ForegroundColor $White
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor $White
Write-Host "    git st         - Compact status" -ForegroundColor $Gray
Write-Host "    git lg         - Pretty log graph" -ForegroundColor $Gray
Write-Host "    git docupdate  - Quick docs commit + push" -ForegroundColor $Gray
Write-Host "    git wip        - Quick checkpoint" -ForegroundColor $Gray
Write-Host "    git undo       - Undo last commit (keep changes)" -ForegroundColor $Gray
