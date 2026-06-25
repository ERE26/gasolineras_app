$ErrorActionPreference = "Stop"

$Manifest = "android\app\src\main\AndroidManifest.xml"

if (!(Test-Path $Manifest)) {
  Write-Host "No encuentro $Manifest. Ejecuta primero: npx cap add android" -ForegroundColor Red
  exit 1
}

$text = Get-Content $Manifest -Raw

# Permisos ubicación
if ($text -notmatch "android\.permission\.ACCESS_COARSE_LOCATION") {
  $text = $text -replace "<manifest([^>]*)>", "<manifest`$1>`r`n    <uses-permission android:name=`"android.permission.ACCESS_COARSE_LOCATION`" />"
}

if ($text -notmatch "android\.permission\.ACCESS_FINE_LOCATION") {
  $text = $text -replace "(<uses-permission android:name=`"android.permission.ACCESS_COARSE_LOCATION`" />)", "`$1`r`n    <uses-permission android:name=`"android.permission.ACCESS_FINE_LOCATION`" />"
}

# Nombre e icono de app
$text = $text -replace 'android:label="[^"]*"', 'android:label="@string/app_name"'
$text = $text -replace 'android:icon="[^"]*"', 'android:icon="@mipmap/ic_launcher"'
$text = $text -replace 'android:roundIcon="[^"]*"', 'android:roundIcon="@mipmap/ic_launcher_round"'

Set-Content -Path $Manifest -Value $text -Encoding UTF8

Write-Host "v6.5 aplicado correctamente:" -ForegroundColor Green
Write-Host "- Icono Android Rivvo"
Write-Host "- Nombre visible Rivvo"
Write-Host "- Permisos ACCESS_COARSE_LOCATION y ACCESS_FINE_LOCATION"
Write-Host ""
Write-Host "Ahora ejecuta:"
Write-Host "npm run build:mobile"
Write-Host "npx cap sync android"
