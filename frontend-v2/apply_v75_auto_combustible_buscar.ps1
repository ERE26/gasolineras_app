$ErrorActionPreference = "Stop"

$Path = "app\buscar\page.tsx"

if (!(Test-Path $Path)) {
  Write-Host "No encuentro $Path. Ejecuta esto desde frontend-v2." -ForegroundColor Red
  exit 1
}

$text = Get-Content $Path -Raw

# 1) selectVehicle: al elegir coche, también actualiza resultados con su combustible.
$oldSelectVehicle = @'
  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    setFuel(vehicle.fuel);
  }
'@

$newSelectVehicle = @'
  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    void applyFuelChange(vehicle.fuel);
  }
'@

if ($text.Contains($oldSelectVehicle)) {
  $text = $text.Replace($oldSelectVehicle, $newSelectVehicle)
} elseif ($text -notmatch "void applyFuelChange\(vehicle\.fuel\)") {
  Write-Host "Aviso: no he encontrado selectVehicle exacto. Revisa manualmente si el coche cambia combustible." -ForegroundColor Yellow
}

# 2) loadManualRanking acepta combustible explícito para no depender del setState.
$text = $text.Replace("async function loadManualRanking() {", "async function loadManualRanking(selectedFuel = fuel) {")

$text = $text.Replace(
@'
          fuel,
          areaInfo
'@,
@'
          selectedFuel,
          areaInfo
'@)

$text = $text.Replace("await loadNearby(fuel);", "await loadNearby(selectedFuel);")

$text = $text.Replace(
@'
      const params = new URLSearchParams({
        fuel,
        limit: selectedBrands.length > 0 ? "120" : "25",
      });
'@,
@'
      const params = new URLSearchParams({
        fuel: selectedFuel,
        limit: selectedBrands.length > 0 ? "120" : "25",
      });
'@)

$text = $text.Replace(
@'
          fuel,
          brands: selectedBrands,
'@,
@'
          fuel: selectedFuel,
          brands: selectedBrands,
'@)

# 3) Añade helper applyFuelChange antes de los useEffect, solo si no existe ya.
if ($text -notmatch "async function applyFuelChange") {
  $insertAfter = @'
  async function loadManualRanking(selectedFuel = fuel) {
'@

  $idx = $text.IndexOf($insertAfter)
  if ($idx -lt 0) {
    Write-Host "No he encontrado loadManualRanking para insertar applyFuelChange." -ForegroundColor Red
    exit 1
  }

  # Buscar el cierre de loadManualRanking por el marcador justo antes del primer useEffect posterior.
  $marker = @'

  useEffect(() => {
    loadFilters();
'@
  $markerIdx = $text.IndexOf($marker, $idx)
  if ($markerIdx -lt 0) {
    $marker = @'

  useEffect(() => {
'@
    $markerIdx = $text.IndexOf($marker, $idx)
  }

  if ($markerIdx -lt 0) {
    Write-Host "No he encontrado dónde insertar applyFuelChange." -ForegroundColor Red
    exit 1
  }

  $helper = @'

  async function applyFuelChange(nextFuel: string) {
    setFuel(nextFuel);

    // Si aún no hay resultados, solo cambiamos la selección visual.
    // Así no pedimos ubicación ni hacemos búsquedas automáticas antes de tiempo.
    if (stations.length === 0 && !userLocation && !province.trim() && !municipality.trim() && !selectedAddress) {
      return;
    }

    // Si había una dirección concreta seleccionada, mantenemos esa zona.
    if (selectedAddress) {
      await runSmartNearby(
        selectedAddress.lat,
        selectedAddress.lon,
        selectedAddress.label,
        nextFuel,
        selectedAddress.area
      );
      return;
    }

    // Si había ubicación actual o una búsqueda cercana, recalculamos cerca de esa ubicación.
    if (userLocation) {
      await runSmartNearby(
        userLocation.lat,
        userLocation.lon,
        areaInfo?.label || searchAddress || "ubicación actual",
        nextFuel,
        areaInfo
          ? {
              label: areaInfo.label,
              municipality: areaInfo.municipality,
              isMajorCity: areaInfo.isMajorCity,
            }
          : undefined
      );
      return;
    }

    // Si hay provincia/municipio, recalculamos el ranking con el nuevo combustible.
    if (province.trim() || municipality.trim()) {
      await loadManualRanking(nextFuel);
      return;
    }

    // Fallback: si ya había búsqueda, reutiliza la lógica existente.
    if (stations.length > 0) {
      await loadNearby(nextFuel);
    }
  }
'@

  $text = $text.Insert($markerIdx, $helper)
}

# 4) Botones de combustible principal: actualizan y buscan directamente.
$text = $text.Replace("onClick={() => setFuel(option.value)}", "onClick={() => applyFuelChange(option.value)}")

# 5) Otros combustibles: actualizan y buscan directamente.
$text = $text.Replace(
@'
                        onClick={() => {
                          setFuel(option.value);
                          setOtherFuelMenuOpen(false);
                        }}
'@,
@'
                        onClick={() => {
                          void applyFuelChange(option.value);
                          setOtherFuelMenuOpen(false);
                        }}
'@)

Set-Content -Path $Path -Value $text -Encoding UTF8

Write-Host "v7.5 aplicado correctamente:" -ForegroundColor Green
Write-Host "- Cambiar combustible actualiza resultados directamente."
Write-Host "- Ya no hace falta pulsar Aplicar filtros para el combustible."
Write-Host ""
Write-Host "Ahora ejecuta:"
Write-Host "npm run build"
