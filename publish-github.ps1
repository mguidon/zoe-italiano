# Publish the "italo" app to GitHub Pages under your own account.
# Run this AFTER you have completed `gh auth login` (the device code flow).
#
# Usage (from the Zoe folder):
#   powershell -ExecutionPolicy Bypass -File .\italo\publish-github.ps1
#   powershell -ExecutionPolicy Bypass -File .\italo\publish-github.ps1 -RepoName my-custom-name

param(
    [string]$RepoName = "zoe-italiano",
    [string]$Description = "Zoe learns Italian - listening + quiz"
)

$ErrorActionPreference = "Stop"
$GH = Join-Path $PSScriptRoot "..\tools\gh\bin\gh.exe"
$APPDIR = $PSScriptRoot

if (-not (Test-Path $GH)) { Write-Host "gh.exe not found at $GH" -ForegroundColor Red; exit 1 }

# 1. Make sure we are authenticated
& $GH auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nNot logged in yet. Run this first:" -ForegroundColor Yellow
    Write-Host "  & '$GH' auth login --hostname github.com --git-protocol https --web" -ForegroundColor Cyan
    exit 1
}

# 2. Find the logged-in username (may be several accounts -> pick first)
$ACCOUNT = (& $GH api user --jq .login)
Write-Host "Publishing to GitHub user: $ACCOUNT" -ForegroundColor Green

# 3. Create the repo (public, from the current folder) and push
Push-Location $APPDIR
try {
    & $GH repo list $ACCOUNT 2>$null | Select-String -Pattern ([regex]::Escape($RepoName)) -SimpleMatch | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Repo $RepoName already exists - just pushing updates." -ForegroundColor Yellow
        & $GH repo push $RepoName main 2>&1
    } else {
        & $GH repo create $RepoName --public --source=. --remote=origin --push --description $Description
    }
    # Ensure main branch is pushed
    & $GH repo sync "$ACCOUNT/$RepoName" --force 2>$null
} finally { Pop-Location }

# 4. Enable GitHub Pages (deploy from branch 'main', root '/'), ignore if it already exists
Write-Host "Enabling GitHub Pages..." -ForegroundColor Green
& $GH api -X POST "repos/$ACCOUNT/$RepoName/pages" -f "source[branch]=main" -f "source[root]=/" 2>&1 | Out-String | Write-Host

# 5. Report the URL
$URL = "https://$ACCOUNT.github.io/$RepoName/"
Write-Host "`nDone! Zoe's page will be live here in 1-2 minutes:" -ForegroundColor Green
Write-Host "  $URL" -ForegroundColor Cyan
Write-Host "Check build status:  gh api repos/$ACCOUNT/$RepoName/pages  (or the repo's Settings -> Pages tab)"
