# Synchronizuje kluczowe zmienne produkcyjne Lumine na Railway (backend Medusa).
# Wymaga: railway CLI zalogowany na konto lumine.strona@gmail.com i podlinkowany
# projekt „Lumine backend” (service: Medusa Backend).
#
# Użycie z roota repo:
#   railway login
#   railway link   # wybierz projekt Lumine backend → Medusa Backend
#   pwsh ./scripts/sync-railway-lumine-env.ps1

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\apps\backend\.env"

if (-not (Test-Path $envFile)) {
  Write-Error "Brak pliku $envFile — utwórz z .env.example"
}

function Get-EnvValue([string]$key) {
  foreach ($line in Get-Content $envFile) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith("#")) { continue }
    if ($t -match "^$([regex]::Escape($key))=(.*)$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Nie zalogowano w Railway CLI. Uruchom: railway login"
}
Write-Host "Railway: $whoami"

$vars = @{
  PRZELEWY24_MERCHANT_ID = Get-EnvValue "PRZELEWY24_MERCHANT_ID"
  PRZELEWY24_POS_ID      = Get-EnvValue "PRZELEWY24_POS_ID"
  PRZELEWY24_API_KEY     = Get-EnvValue "PRZELEWY24_API_KEY"
  PRZELEWY24_CRC         = Get-EnvValue "PRZELEWY24_CRC"
  PRZELEWY24_SANDBOX     = Get-EnvValue "PRZELEWY24_SANDBOX"
  MEDUSA_BACKEND_URL     = Get-EnvValue "MEDUSA_BACKEND_URL"
  STOREFRONT_URL         = Get-EnvValue "STOREFRONT_URL"
}

foreach ($entry in $vars.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($entry.Value)) {
    Write-Warning "Pomijam pustą zmienną: $($entry.Key)"
    continue
  }
  Write-Host "Ustawiam $($entry.Key)..."
  railway variables set "$($entry.Key)=$($entry.Value)" --service "Medusa Backend"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set $($entry.Key). Check railway link."
  }
}

# CORS — lumineconcept.pl + Vercel preview
$storeCors = "https://lumineconcept.pl,https://www.lumineconcept.pl,https://lumineconcept-storefront.vercel.app,http://localhost:3000"
$authCors  = $storeCors
Write-Host "Ustawiam STORE_CORS..."
railway variables set "STORE_CORS=$storeCors" --service "Medusa Backend"
Write-Host "Ustawiam AUTH_CORS..."
railway variables set "AUTH_CORS=$authCors" --service "Medusa Backend"

Write-Host ""
Write-Host "Gotowe. Zrestartuj / redeploy backend na Railway."
Write-Host "Smoke test P24: cd apps/backend && npx tsx src/scripts/test-p24-smoke.ts"
