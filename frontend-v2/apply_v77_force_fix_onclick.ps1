$ErrorActionPreference = "Stop"

$Path = "app\buscar\page.tsx"

if (!(Test-Path $Path)) {
  Write-Host "No encuentro $Path. Ejecuta esto desde frontend-v2." -ForegroundColor Red
  exit 1
}

$text = Get-Content $Path -Raw

$before = ([regex]::Matches($text, 'onClick=\{loadManualRanking\}')).Count

if ($before -eq 0) {
  Write-Host "No he encontrado onClick={loadManualRanking}. Puede que ya esté corregido en tu copia local." -ForegroundColor Yellow
} else {
  $text = [regex]::Replace($text, 'onClick=\{loadManualRanking\}', 'onClick={() => void loadManualRanking()}')
  Set-Content -Path $Path -Value $text -Encoding UTF8
  Write-Host "v7.7 aplicado correctamente:" -ForegroundColor Green
  Write-Host "- Reemplazos hechos: $before"
}

$after = ([regex]::Matches((Get-Content $Path -Raw), 'onClick=\{loadManualRanking\}')).Count

if ($after -gt 0) {
  Write-Host "Aún quedan $after ocurrencias sin corregir." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Comprobación final:"
Select-String -Path $Path -Pattern "loadManualRanking" | Select-Object -First 12

Write-Host ""
Write-Host "Ahora ejecuta:"
Write-Host "npm run build"
