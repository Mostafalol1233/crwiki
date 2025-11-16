# Copies repo-root attached_assets into backend-deploy-full/attached_assets
$src = Join-Path $PSScriptRoot '..\attached_assets'
$dst = Join-Path $PSScriptRoot 'attached_assets'
if (-Not (Test-Path $src)) {
  Write-Host "Source assets not found: $src" -ForegroundColor Yellow
  exit 1
}
if (Test-Path $dst) { Remove-Item -Path $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst -Force | Out-Null
Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
Write-Host "Copied assets from $src to $dst" -ForegroundColor Green
Get-ChildItem -Path $dst -Filter 'merc-*' | ForEach-Object { Write-Host "  - $($_.Name)" }
