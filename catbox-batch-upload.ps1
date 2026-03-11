#!/usr/bin/env powershell
# Batch upload to catbox.moe and generate seed file

param(
    [string]$UploadDir = "attached_assets",
    [string]$OutputFile = "catbox-urls.txt"
)

$CATBOX_API = "https://catbox.moe/user/api.php"
$OUTPUT_SEED = "backend-deploy-full/seed-from-urls.js"

# Clear output file
"" | Set-Content -Path $OutputFile

Write-Host "[*] Starting Catbox batch upload..." -ForegroundColor Cyan
Write-Host ""

# Function to upload a file
function Upload-ToCatbox {
    param([string]$FilePath, [string]$Type)
    
    try {
        $form = @{
            reqtype = "fileupload"
            fileToUpload = Get-Item $FilePath
        }
        $response = Invoke-WebRequest -Uri $CATBOX_API -Method Post -Form $form -ErrorAction Stop
        $url = $response.Content.Trim()
        $filename = (Get-Item $FilePath).Name
        "$Type`:$filename`:$url" | Add-Content -Path $OutputFile
        Write-Host "[OK] $filename -> $url" -ForegroundColor Green
        return $url
    } catch {
        Write-Host "[ERROR] Failed to upload $(Get-Item $FilePath).Name" -ForegroundColor Red
        return $null
    }
}

# Upload mercenaries
Write-Host "[*] Uploading Mercenaries..." -ForegroundColor Yellow
$mercFiles = Get-ChildItem -Path $UploadDir -Filter "merc-*.jpg" -ErrorAction SilentlyContinue
$mercFiles | ForEach-Object {
    Upload-ToCatbox $_.FullName "MERC"
}
Write-Host "[*] Mercenaries: $($mercFiles.Count)`n" -ForegroundColor Green

# Upload weapons
Write-Host "[*] Uploading Weapons..." -ForegroundColor Yellow
$weaponFiles = Get-ChildItem -Path "$UploadDir\weapons" -File -ErrorAction SilentlyContinue
$weaponCount = 0
$weaponFiles | ForEach-Object {
    Upload-ToCatbox $_.FullName "WEAPON"
    $weaponCount++
    if ($weaponCount % 10 -eq 0) {
        Write-Host "[*] Progress: $weaponCount weapons..." -ForegroundColor Cyan
    }
}
Write-Host "[*] Weapons: $weaponCount`n" -ForegroundColor Green

# Upload modes
Write-Host "[*] Uploading Modes..." -ForegroundColor Yellow
$modeFiles = Get-ChildItem -Path "$UploadDir\modes" -File -ErrorAction SilentlyContinue
$modeCount = 0
$modeFiles | ForEach-Object {
    Upload-ToCatbox $_.FullName "MODE"
    $modeCount++
    if ($modeCount % 20 -eq 0) {
        Write-Host "[*] Progress: $modeCount modes..." -ForegroundColor Cyan
    }
}
Write-Host "[*] Modes: $modeCount`n" -ForegroundColor Green

# Upload ranks
Write-Host "[*] Uploading Ranks..." -ForegroundColor Yellow
$rankFiles = Get-ChildItem -Path "$UploadDir\ranks" -File -ErrorAction SilentlyContinue
$rankCount = 0
$rankFiles | ForEach-Object {
    Upload-ToCatbox $_.FullName "RANK"
    $rankCount++
    if ($rankCount % 20 -eq 0) {
        Write-Host "[*] Progress: $rankCount ranks..." -ForegroundColor Cyan
    }
}
Write-Host "[*] Ranks: $rankCount`n" -ForegroundColor Green

Write-Host "[OK] Upload complete! URLs saved to: $OutputFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Next step: node convert-urls-to-seed.js" -ForegroundColor Yellow
