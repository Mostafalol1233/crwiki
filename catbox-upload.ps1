# CATBOX QUICK UPLOAD HELPER (PowerShell)
# Usage: .\catbox-upload.ps1
# Uploads all images to catbox.moe and saves URLs

param(
    [string]$UploadDir = "attached_assets",
    [string]$OutputFile = "catbox-urls.txt"
)

$CATBOX_API = "https://catbox.moe/user/api.php"

# Clear output file
"" | Set-Content -Path $OutputFile

Write-Host "🚀 Starting Catbox Upload..." -ForegroundColor Cyan
Write-Host ""

# Upload mercenaries
Write-Host "⚔️ Uploading Mercenaries..." -ForegroundColor Yellow
Get-ChildItem -Path $UploadDir -Filter "merc-*.jpg" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $form = @{
            reqtype = "fileupload"
            fileToUpload = Get-Item $_.FullName
        }
        $response = Invoke-WebRequest -Uri $CATBOX_API -Method Post -Form $form -ErrorAction Stop
        $url = $response.Content.Trim()
        "MERC:$($_.Name):$url" | Add-Content -Path $OutputFile
        Write-Host "  ✅ $($_.Name) → $url" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Failed: $($_.Name)" -ForegroundColor Red
    }
}

# Upload weapons
Write-Host ""
Write-Host "📦 Uploading Weapons..." -ForegroundColor Yellow
$weaponFiles = @(Get-ChildItem -Path "$UploadDir\weapons" -File -ErrorAction SilentlyContinue)
$weaponCount = 0
$weaponFiles | ForEach-Object {
    try {
        $form = @{
            reqtype = "fileupload"
            fileToUpload = Get-Item $_.FullName
        }
        $response = Invoke-WebRequest -Uri $CATBOX_API -Method Post -Form $form -ErrorAction Stop
        $url = $response.Content.Trim()
        "WEAPON:$($_.Name):$url" | Add-Content -Path $OutputFile
        $weaponCount++
        if ($weaponCount % 10 -eq 0) {
            Write-Host "  ✅ Uploaded $weaponCount weapons..." -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Skipped: $($_.Name)" -ForegroundColor Gray
    }
}
Write-Host "  ✅ Total: $weaponCount weapons" -ForegroundColor Green

# Upload modes
Write-Host ""
Write-Host "🎮 Uploading Modes..." -ForegroundColor Yellow
$modeFiles = @(Get-ChildItem -Path "$UploadDir\modes" -File -ErrorAction SilentlyContinue)
$modeCount = 0
$modeFiles | ForEach-Object {
    try {
        $form = @{
            reqtype = "fileupload"
            fileToUpload = Get-Item $_.FullName
        }
        $response = Invoke-WebRequest -Uri $CATBOX_API -Method Post -Form $form -ErrorAction Stop
        $url = $response.Content.Trim()
        "MODE:$($_.Name):$url" | Add-Content -Path $OutputFile
        $modeCount++
        if ($modeCount % 50 -eq 0) {
            Write-Host "  ✅ Uploaded $modeCount modes..." -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Skipped: $($_.Name)" -ForegroundColor Gray
    }
}
Write-Host "  ✅ Total: $modeCount modes" -ForegroundColor Green

# Upload ranks
Write-Host ""
Write-Host "🏅 Uploading Ranks..." -ForegroundColor Yellow
$rankFiles = @(Get-ChildItem -Path "$UploadDir\ranks" -File -ErrorAction SilentlyContinue)
$rankCount = 0
$rankFiles | ForEach-Object {
    try {
        $form = @{
            reqtype = "fileupload"
            fileToUpload = Get-Item $_.FullName
        }
        $response = Invoke-WebRequest -Uri $CATBOX_API -Method Post -Form $form -ErrorAction Stop
        $url = $response.Content.Trim()
        "RANK:$($_.Name):$url" | Add-Content -Path $OutputFile
        $rankCount++
        if ($rankCount % 10 -eq 0) {
            Write-Host "  ✅ Uploaded $rankCount ranks..." -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Skipped: $($_.Name)" -ForegroundColor Gray
    }
}
Write-Host "  ✅ Total: $rankCount ranks" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Upload complete! URLs saved to: $OutputFile" -ForegroundColor Cyan
Write-Host "📋 Format: TYPE:FILENAME:CATBOX_URL"
Write-Host ""
Write-Host "Summary: $(10) mercenaries + $($weaponCount) weapons + $($modeCount) modes + $($rankCount) ranks"
