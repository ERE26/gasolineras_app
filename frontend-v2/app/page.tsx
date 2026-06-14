"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import StationCard from "./components/StationCard";

const GasMap = dynamic(() => import("./components/GasMap"), {
  ssr: false,
});

type Station = {
  id: number;
  name: string;
  brand: string;
  address: string;
  province: string;
  municipality: string;
  latitude: number;
  longitude: number;
  price: string;
  fuel_type: string;
  captured_at: string;
  distance_meters?: number;
  schedule?: string;
};

type Summary = {
  totalStations: number;
  totalPrices: number;
  lastUpdate: string;
};

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [liters, setLiters] = useState(50);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [favoriteStationIds, setFavoriteStationIds] = useState<number[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleFuel, setNewVehicleFuel] = useState("gasolina95");
  const [newVehicleTank, setNewVehicleTank] = useState(50);
  const [newVehicleConsumption, setNewVehicleConsumption] = useState(6);

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  async function loadSummary() {
    try {
      const response = await fetch(`${API_URL}/api/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error cargando resumen:", error);
    }
  }

  async function loadFilters(selectedProvince?: string) {
    try {
      const params = new URLSearchParams();

      if (selectedProvince) {
        params.append("province", selectedProvince);
      }

      const response = await fetch(`${API_URL}/api/filters?${params.toString()}`);

      if (!response.ok) {
        throw new Error("No se pudieron cargar los filtros");
      }

      const data = await response.json();

      setProvinces(data.provinces || []);
      setMunicipalities(data.municipalities || []);
    } catch (error) {
      console.error("Error cargando filtros:", error);
      setProvinces([]);
      setMunicipalities([]);
    }
  }

  function loadVehiclesFromStorage() {
    const saved = localStorage.getItem("myVehicles");

    if (!saved) return;

    const parsed: Vehicle[] = JSON.parse(saved);

    setVehicles(parsed);

    if (parsed.length > 0) {
      setSelectedVehicleId(parsed[0].id);
      setFuel(parsed[0].fuel);
      setLiters(parsed[0].tankLiters);
    }
  }

  function saveVehicles(nextVehicles: Vehicle[]) {
    setVehicles(nextVehicles);
    localStorage.setItem("myVehicles", JSON.stringify(nextVehicles));
  }

  function loadFavoritesFromStorage() {
    const saved = localStorage.getItem("favoriteStations");

    if (!saved) return;

    const parsed: number[] = JSON.parse(saved);
    setFavoriteStationIds(parsed);
  }

  function saveFavorites(nextFavorites: number[]) {
    setFavoriteStationIds(nextFavorites);
    localStorage.setItem("favoriteStations", JSON.stringify(nextFavorites));
  }

  function toggleFavoriteStation(stationId: number) {
    const exists = favoriteStationIds.includes(stationId);

    const nextFavorites = exists
      ? favoriteStationIds.filter((id) => id !== stationId)
      : [...favoriteStationIds, stationId];

    saveFavorites(nextFavorites);
  }

  function addVehicle() {
    if (!newVehicleName.trim()) {
      alert("Ponle un nombre al vehículo.");
      return;
    }

    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: newVehicleName.trim(),
      fuel: newVehicleFuel,
      tankLiters: newVehicleTank,
      consumption: newVehicleConsumption,
    };

    const nextVehicles = [...vehicles, vehicle];

    saveVehicles(nextVehicles);
    setSelectedVehicleId(vehicle.id);
    setFuel(vehicle.fuel);
    setLiters(vehicle.tankLiters);

    setNewVehicleName("");
    setNewVehicleFuel("gasolina95");
    setNewVehicleTank(50);
    setNewVehicleConsumption(6);
  }

  function deleteSelectedVehicle() {
    if (!selectedVehicleId) return;

    const nextVehicles = vehicles.filter(
      (vehicle) => vehicle.id !== selectedVehicleId
    );

    saveVehicles(nextVehicles);

    if (nextVehicles.length > 0) {
      setSelectedVehicleId(nextVehicles[0].id);
      setFuel(nextVehicles[0].fuel);
      setLiters(nextVehicles[0].tankLiters);
    } else {
      setSelectedVehicleId("");
    }
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);

    const vehicle = vehicles.find((item) => item.id === vehicleId);

    if (!vehicle) return;

    setFuel(vehicle.fuel);
    setLiters(vehicle.tankLiters);
  }

  async function loadRanking() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        fuel,
        limit: "10",
      });

      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) {
        params.append("municipality", municipality.trim());
      }

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);

      const data = await response.json();

      setStations(data);
      setUserLocation(null);
    } catch (error) {
      console.error(error);
      alert("Error cargando el ranking.");
    } finally {
      setLoading(false);
    }
  }
  
  async function searchByAddress() {
  if (!searchAddress.trim()) {
    alert("Escribe una dirección o zona.");
    return;
  }

  setLoading(true);

  try {
    const query = encodeURIComponent(`${searchAddress}, España`);

    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
    );

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      alert("No he encontrado esa dirección.");
      setLoading(false);
      return;
    }

    const lat = Number(geoData[0].lat);
    const lon = Number(geoData[0].lon);

    setUserLocation({ lat, lon });

    const radiusMeters = searchRadiusKm * 1000;

    const response = await fetch(
      `${API_URL}/api/nearby?lat=${lat}&lon=${lon}&fuel=${fuel}&radius=${radiusMeters}&limit=25`
    );

    const data = await response.json();

    setStations(data);
  } catch (error) {
    console.error(error);
    alert("Error buscando por dirección.");
  } finally {
    setLoading(false);
  }
}

  async function loadNearby() {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite geolocalización.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setUserLocation({ lat, lon });

          const response = await fetch(
          `${API_URL}/api/nearby?lat=${lat}&lon=${lon}&fuel=${fuel}&radius=${searchRadiusKm * 1000}&limit=50`);

          const data = await response.json();

          setStations(data);
        } catch (error) {
          console.error(error);
          alert("Error buscando gasolineras cercanas.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        alert("No se ha podido obtener tu ubicación.");
        setLoading(false);
      }
    );
  }

  async function updateNow() {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/update-now`, {
        method: "POST",
      });

      if (!response.ok) {
        alert("Error actualizando datos.");
      } else {
        alert("Datos actualizados correctamente.");
        await loadSummary();
        await loadRanking();
      }
    } catch (error) {
      console.error(error);
      alert("Error actualizando datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  loadSummary();
  loadVehiclesFromStorage();
  loadFavoritesFromStorage();
}, []);

  useEffect(() => {
    if (province) {
      loadFilters(province);
      setMunicipality("");
    } else {
      loadFilters();
      setMunicipality("");
    }
  }, [province]);

  const cheapest = stations[0];

  const averagePrice = useMemo(() => {
    if (stations.length === 0) return null;

    const prices = stations
      .map((station) => Number(station.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return prices.reduce((acc, price) => acc + price, 0) / prices.length;
  }, [stations]);

  const estimatedSaving = useMemo(() => {
    if (!cheapest || !averagePrice) return null;

    const cheapestPrice = Number(cheapest.price);
    return (averagePrice - cheapestPrice) * liters;
  }, [cheapest, averagePrice, liters]);

  const favoriteStations = stations.filter((station) =>
    favoriteStationIds.includes(station.id)
  );

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId
  );

  const fullTankCost = useMemo(() => {
    if (!cheapest || !selectedVehicle) return null;

    return Number(cheapest.price) * selectedVehicle.tankLiters;
  }, [cheapest, selectedVehicle]);

  const rangeKm = useMemo(() => {
    if (!selectedVehicle) return null;

    return (selectedVehicle.tankLiters / selectedVehicle.consumption) * 100;
  }, [selectedVehicle]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-slate-900/70 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Geoportal Gasolineras España
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Encuentra la gasolinera más barata cerca de ti
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Datos oficiales del Geoportal/MITECO guardados en tu propia base
              de datos.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">Estaciones</p>
              <p className="text-xl font-bold">
                {summary?.totalStations ?? "-"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">Precios</p>
              <p className="text-xl font-bold">{summary?.totalPrices ?? "-"}</p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-300">Última actualización</p>
              <p className="text-xs font-semibold">
                {summary?.lastUpdate
                  ? new Date(summary.lastUpdate).toLocaleString("es-ES")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold">Filtros</h2>

            <label className="mb-2 block text-sm text-slate-300">
              Combustible
            </label>
            <select
              value={fuel}
              onChange={(e) => setFuel(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
            >
              <option value="gasolina95">Gasolina 95</option>
              <option value="gasolina98">Gasolina 98</option>
              <option value="diesel">Diésel</option>
              <option value="diesel_premium">Diésel premium</option>
              <option value="glp">GLP</option>
              <option value="gnc">GNC</option>
              <option value="gnl">GNL</option>
              <option value="hidrogeno">Hidrógeno</option>
            </select>

            <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-3 font-bold">Buscar por dirección</h3>

              <label className="mb-2 block text-sm text-slate-300">
                Dirección, barrio o ciudad
              </label>
              <input
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Ej: Calle Serrano 45, Madrid"
                className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500"
              />

              <label className="mb-2 block text-sm text-slate-300">
                Radio de búsqueda
              </label>
              <select
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
              </select>

              <button
                onClick={searchByAddress}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-bold text-white hover:bg-indigo-400"
              >
                Buscar cerca de esta dirección
              </button>
            </div>

            <label className="mb-2 block text-sm text-slate-300">
              Provincia
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
            >
              <option value="">Toda España</option>
              {provinces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-sm text-slate-300">
              Municipio
            </label>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
            >
              <option value="">Todos los municipios</option>
              {municipalities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-sm text-slate-300">
              Litros del depósito
            </label>
            <input
              type="number"
              value={liters}
              onChange={(e) => setLiters(Number(e.target.value))}
              className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
            />

            <div className="grid gap-3">
              <button
                onClick={loadRanking}
                className="rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400"
              >
                Buscar ranking
              </button>

              <button
                onClick={loadNearby}
                className="rounded-xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-400"
              >
                Usar mi ubicación
              </button>

              <button
                onClick={updateNow}
                className="rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/20"
              >
                Actualizar datos ahora
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Mis vehículos</h2>
              <p className="mt-1 text-sm text-slate-300">
                Guarda tu coche o moto para calcular automáticamente cuánto
                cuesta llenar el depósito, cuánto puedes ahorrar y tu autonomía
                aproximada.
              </p>
            </div>

            {vehicles.length > 0 && (
              <>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Vehículo seleccionado
                </label>

                <select
                  value={selectedVehicleId}
                  onChange={(e) => selectVehicle(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </option>
                  ))}
                </select>

                {selectedVehicle && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-200">
                    <p className="mb-1">
                      Combustible: <strong>{selectedVehicle.fuel}</strong>
                    </p>
                    <p className="mb-1">
                      Capacidad del depósito:{" "}
                      <strong>{selectedVehicle.tankLiters} L</strong>
                    </p>
                    <p className="mb-1">
                      Consumo medio:{" "}
                      <strong>{selectedVehicle.consumption} L/100 km</strong>
                    </p>

                    {fullTankCost !== null && (
                      <p className="mt-3 text-emerald-300">
                        Llenar el depósito en la mejor gasolinera:{" "}
                        <strong>{fullTankCost.toFixed(2)} €</strong>
                      </p>
                    )}

                    {rangeKm !== null && (
                      <p className="text-blue-300">
                        Autonomía estimada:{" "}
                        <strong>{rangeKm.toFixed(0)} km</strong>
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={deleteSelectedVehicle}
                  className="mb-5 w-full rounded-xl bg-red-500/20 px-4 py-3 font-bold text-red-200 hover:bg-red-500/30"
                >
                  Eliminar vehículo seleccionado
                </button>
              </>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <h3 className="mb-4 font-bold">Añadir nuevo vehículo</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Nombre del vehículo
                  </label>
                  <input
                    value={newVehicleName}
                    onChange={(e) => setNewVehicleName(e.target.value)}
                    placeholder="Ej: Golf, Ibiza, Moto..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Tipo de combustible
                  </label>
                  <select
                    value={newVehicleFuel}
                    onChange={(e) => setNewVehicleFuel(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white"
                  >
                    <option value="gasolina95">Gasolina 95</option>
                    <option value="gasolina98">Gasolina 98</option>
                    <option value="diesel">Diésel</option>
                    <option value="diesel_premium">Diésel premium</option>
                    <option value="glp">GLP</option>
                    <option value="gnc">GNC</option>
                    <option value="gnl">GNL</option>
                    <option value="hidrogeno">Hidrógeno</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Capacidad del depósito
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newVehicleTank}
                      onChange={(e) =>
                        setNewVehicleTank(Number(e.target.value))
                      }
                      placeholder="Ej: 50"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-12 text-white"
                    />
                    <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">
                      L
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Consumo medio
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={newVehicleConsumption}
                      onChange={(e) =>
                        setNewVehicleConsumption(Number(e.target.value))
                      }
                      placeholder="Ej: 6.0"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 pr-24 text-white"
                    />
                    <span className="absolute right-4 top-3 text-sm font-bold text-slate-400">
                      L/100 km
                    </span>
                  </div>
                </div>

                <button
                  onClick={addVehicle}
                  className="w-full rounded-xl bg-purple-500 px-4 py-3 font-bold text-white hover:bg-purple-400"
                >
                  Guardar vehículo
                </button>
              </div>
            </div>
          </div>

          {favoriteStations.length > 0 && (
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5">
              <h2 className="mb-3 text-lg font-bold text-yellow-200">
                Gasolineras favoritas
              </h2>

              <div className="space-y-3">
                {favoriteStations.slice(0, 5).map((station) => (
                  <div
                    key={station.id}
                    className="rounded-2xl bg-slate-900 p-3 text-sm"
                  >
                    <p className="font-bold">{station.name}</p>
                    <p className="text-slate-400">
                      {station.municipality}, {station.province}
                    </p>
                    <p className="mt-1 font-black text-emerald-300">
                      {Number(station.price).toFixed(3)} €/L
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cheapest && (
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
              <p className="text-sm font-semibold text-emerald-300">
                Mejor opción
              </p>
              <h3 className="mt-2 text-xl font-bold">{cheapest.name}</h3>
              <p className="text-sm text-slate-300">
                {cheapest.address}, {cheapest.municipality}
              </p>
              <p className="mt-3 text-3xl font-black text-emerald-300">
                {Number(cheapest.price).toFixed(3)} €/L
              </p>

              {estimatedSaving !== null && (
                <p className="mt-2 text-sm text-slate-200">
                  Ahorro estimado frente a la media mostrada:{" "}
                  <strong>{estimatedSaving.toFixed(2)} €</strong>
                </p>
              )}
            </div>
          )}
        </aside>

        <section className="space-y-4">
          <div className="h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <GasMap stations={stations} userLocation={userLocation} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Gasolineras encontradas</h2>
              {loading && (
                <p className="text-sm text-emerald-300">Cargando...</p>
              )}
            </div>

            <div className="max-h-[520px] space-y-3 overflow-auto pr-2">
              {stations.map((station, index) => (
                <StationCard
                  key={station.id}
                  station={station}
                  index={index}
                  averagePrice={averagePrice}
                  selectedVehicle={selectedVehicle}
                  isFavorite={favoriteStationIds.includes(station.id)}
                  onToggleFavorite={toggleFavoriteStation}
                />
              ))}

              {stations.length === 0 && !loading && (
                <p className="text-slate-300">
                  No hay resultados. Prueba otro filtro.
                </p>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}