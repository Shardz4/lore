# Lore Git Secret Purging Utility
# WARNING: This script rewrites Git history to remove any tracked .env and .env.local files.

Write-Host "=== Lore Git Secret Purging Utility ===" -ForegroundColor Yellow
Write-Host "WARNING: This script will rewrite Git history to remove any tracked .env files." -ForegroundColor Red
Write-Host "You will need to force push changes to your remote afterwards (git push origin --force)." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? (y/n)"
if ($confirmation -ne "y" -and $confirmation -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    Exit
}

# Check if git-filter-repo is available
$hasFilterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue

if ($hasFilterRepo) {
    Write-Host "Using modern git-filter-repo..." -ForegroundColor Green
    git-filter-repo --path .env --path .env.local --invert-paths --force
} else {
    Write-Host "git-filter-repo not found. Falling back to built-in git filter-branch..." -ForegroundColor Cyan
    git filter-branch --force --index-filter `
      "git rm --cached --ignore-unmatch .env .env.local **/.*env **/.*env.local" `
      --prune-empty --tag-name-filter cat -- --all
}

Write-Host "=== Purging Complete ===" -ForegroundColor Green
Write-Host "To clean local garbage collection and shrink the repo, run:" -ForegroundColor Yellow
Write-Host "git reflog expire --expire=now --all; git gc --prune=now --aggressive" -ForegroundColor Cyan
Write-Host ""
Write-Host "Don't forget to force push your branches: git push origin --force" -ForegroundColor Yellow
