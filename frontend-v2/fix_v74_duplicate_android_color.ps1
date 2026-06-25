$ErrorActionPreference = "Stop"

$ColorsPath = "android\app\src\main\res\values\colors.xml"
$DuplicatePath = "android\app\src\main\res\values\ic_launcher_background.xml"

if (!(Test-Path $ColorsPath)) {
  Write-Host "No encuentro $ColorsPath. Ejecuta esto desde frontend-v2." -ForegroundColor Red
  exit 1
}

$text = Get-Content $ColorsPath -Raw

# Elimina la línea duplicada porque Android ya tiene ic_launcher_background.xml
$text = $text -replace '\s*<color name="ic_launcher_background">[^<]*</color>', ''

# Asegura que el archivo siga bien formateado
Set-Content -Path $ColorsPath -Value $text.Trim() -Encoding UTF8

Write-Host "v7.4 aplicado correctamente:" -ForegroundColor Green
Write-Host "- Eliminado color duplicado ic_launcher_background de colors.xml"

if (Test-Path $DuplicatePath) {
  Write-Host "- Conservado archivo nativo existente: $DuplicatePath"
}

Write-Host ""
Write-Host "Ahora ejecuta:"
Write-Host "cd android"
Write-Host "gradlew assembleDebug"
