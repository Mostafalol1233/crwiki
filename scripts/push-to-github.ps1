param(
  [string]$Branch = "main",
  [string]$Message = "chore: sync wiki scraper and importer updates"
)

Write-Host "Switching to branch $Branch..."
& git checkout -B $Branch

Write-Host "Staging files..."
& git add .

Write-Host "Creating commit..."
& git commit -m $Message

Write-Host "Pushing to origin/$Branch..."
& git push -u origin $Branch
