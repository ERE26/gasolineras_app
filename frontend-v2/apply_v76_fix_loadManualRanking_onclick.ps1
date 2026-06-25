$ErrorActionPreference = "Stop"

$Path = "app\buscar\page.tsx"

if (!(Test-Path $Path)) {
  Write-Host "No encuentro $Path. Ejecuta esto desde frontend-v2." -ForegroundColor Red
  exit 1
}

$text = Get-Content $Path -Raw

# Tras v7.5, loadManualRanking ahora recibe un string opcional.
# Por eso no puede pasarse directamente como onClick, porque React le manda el evento del ratón.
$text = $text.Replace("onClick={loadManualRanking}", "onClick={() => void loadManualRanking()}")

Set-Content -Path $Path -Value $text -Encoding UTF8

Write-Host "v7.6 aplicado correctamente:" -ForegroundColor Green
Write-Host "- Corregido onClick de Aplicar filtros."
Write-Host "- React ya no pasa el MouseEvent a loadManualRanking."
Write-Host ""
Write-Host "Ahora ejecuta:"
Write-Host "npm run build"
