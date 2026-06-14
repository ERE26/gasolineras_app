"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AutocompleteInput from "../components/AutocompleteInput";
import FuelAssistant from "../components/FuelAssistant";
import StationCard from "../components/StationCard";

const GasMap = dynamic(() => import("../components/GasMap"), {
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
  lastUpdate: string | null;
};

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fuelOptions = [
  { value: "gasolina95", label: "Gasolina 95" },
  { value: "gasolina98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel premium" },
  { value: "glp", label: "GLP" },
  { value: "gnc", label: "GNC" },
  { value: "gnl", label: "GNL" },
  { value: "hidrogeno", label: "Hidrógeno" },
];

const radiusOptions = [5, 10, 15, 25, 50];
const popularBrands = ["REPSOL", "MOEVE", "CEPSA", "GALP", "BP", "SHELL", "PLENOIL", "BALLENOIL", "PETROPRIX"];

function formatDate(value: string | null | undefined) {
  if (!value) return "pendiente";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [brand, setBrand] = useState("");
  const [liters, setLiters] = useState(50);

  const [searchAddress, setSearchAddress] = useState("");
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>(popularBrands);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [favoriteStationIds, setFavoriteStationIds] = useState<number[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleFuel, setNewVehicleFuel] = useState("gasolina95");
  const [newVehicleTank, setNewVehicleTank] = useState(50);
  const [newVehicleConsumption, setNewVehicleConsumption] = useState(6);

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

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
      if (selectedProvince) params.append("province", selectedProvince);

      const response = await fetch(`${API_URL}/api/filters?${params.toString()}`);
      const data = await response.json();

      setProvinces(data.provinces || []);
      setMunicipalities(data.municipalities || []);
    } catch (error) {
      console.error("Error cargando filtros:", error);
      setProvinces([]);
      setMunicipalities([]);
    }
  }

  async function loadBrands(search: string) {
    try {
      const response = await fetch(`${API_URL}/api/brands?search=${encodeURIComponent(search)}&limit=12`);
      const data = await response.json();
      const merged = Array.from(new Set([...popularBrands, ...(Array.isArray(data) ? data : [])]));
      setBrandSuggestions(merged);
    } catch (error) {
      console.error("Error cargando marcas:", error);
      setBrandSuggestions(popularBrands);
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
    setFavoriteStationIds(JSON.parse(saved));
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
    const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== selectedVehicleId);
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

  async function loadRanking(customFuel?: string) {
    setLoading(true);

    try {
      const params = new URLSearchParams({ fuel: customFuel || fuel, limit: "25" });
      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) params.append("municipality", municipality.trim());
      if (brand.trim()) params.append("brand", brand.trim());

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

  async function searchByAddress(customFuel?: string) {
    if (!searchAddress.trim()) {
      alert("Escribe una dirección o zona.");
      return;
    }

    setLoading(true);

    try {
      const query = encodeURIComponent(`${searchAddress}, España`);
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        alert("No he encontrado esa dirección.");
        setLoading(false);
        return;
      }

      const lat = Number(geoData[0].lat);
      const lon = Number(geoData[0].lon);
      setUserLocation({ lat, lon });

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        fuel: customFuel || fuel,
        radius: String(searchRadiusKm * 1000),
        limit: "25",
      });

      if (brand.trim()) params.append("brand", brand.trim());

      const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
      const data = await response.json();
      setStations(data);
    } catch (error) {
      console.error(error);
      alert("Error buscando por dirección.");
    } finally {
      setLoading(false);
    }
  }

  async function loadNearby(customFuel?: string) {
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

          const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            fuel: customFuel || fuel,
            radius: String(searchRadiusKm * 1000),
            limit: "25",
          });

          if (brand.trim()) params.append("brand", brand.trim());

          const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
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

  function quickNearby95() {
    setFuel("gasolina95");
    loadNearby("gasolina95");
  }

  function quickNearbyDiesel() {
    setFuel("diesel");
    loadNearby("diesel");
  }

  useEffect(() => {
    loadSummary();
    loadFilters();
    loadVehiclesFromStorage();
    loadFavoritesFromStorage();
  }, []);

  useEffect(() => {
    loadFilters(province || undefined);
    setMunicipality("");
  }, [province]);

  useEffect(() => {
    const timeout = setTimeout(() => loadBrands(brand), 250);
    return () => clearTimeout(timeout);
  }, [brand]);

  const cheapest = stations[0];

  const averagePrice = useMemo(() => {
    if (stations.length === 0) return null;
    const prices = stations.map((station) => Number(station.price)).filter(Number.isFinite);
    if (prices.length === 0) return null;
    return prices.reduce((acc, price) => acc + price, 0) / prices.length;
  }, [stations]);

  const estimatedSaving = useMemo(() => {
    if (!cheapest || !averagePrice) return null;
    return (averagePrice - Number(cheapest.price)) * liters;
  }, [cheapest, averagePrice, liters]);

  const favoriteStations = stations.filter((station) => favoriteStationIds.includes(station.id));
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const fullTankCost = useMemo(() => {
    if (!cheapest || !selectedVehicle) return null;
    return Number(cheapest.price) * selectedVehicle.tankLiters;
  }, [cheapest, selectedVehicle]);

  const rangeKm = useMemo(() => {
    if (!selectedVehicle) return null;
    return (selectedVehicle.tankLiters / selectedVehicle.consumption) * 100;
  }, [selectedVehicle]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 text-xl font-black text-white">
              G
            </div>
            <div>
              <p className="text-lg font-black">Gasolineras App</p>
              <p className="text-xs text-slate-500">Buscar y comparar precios</p>
            </div>
          </Link>
          <Link href="/" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
            Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-5">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-xs font-black text-slate-600 md:justify-between">
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            {summary?.totalStations?.toLocaleString("es-ES") ?? "-"} estaciones
          </span>
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            {summary?.totalPrices?.toLocaleString("es-ES") ?? "-"} precios
          </span>
          <span className="rounded-full bg-white px-4 py-2 shadow-sm">
            Actualización automática: {formatDate(summary?.lastUpdate)}
          </span>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-center text-sm font-black text-emerald-600">Modo rápido</p>
          <h1 className="mt-1 text-center text-3xl font-black">¿Qué quieres hacer?</h1>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <button onClick={quickNearby95} className="rounded-3xl bg-emerald-500 px-4 py-4 font-black text-white shadow-lg hover:bg-emerald-400">
              Gasolina 95 cerca de mí
            </button>
            <button onClick={quickNearbyDiesel} className="rounded-3xl bg-blue-600 px-4 py-4 font-black text-white shadow-lg hover:bg-blue-500">
              Diésel cerca de mí
            </button>
            <button onClick={() => loadRanking()} className="rounded-3xl bg-slate-950 px-4 py-4 font-black text-white shadow-lg hover:bg-slate-800">
              Más barata por zona
            </button>
            <button onClick={() => document.getElementById("marca")?.focus()} className="rounded-3xl bg-purple-600 px-4 py-4 font-black text-white shadow-lg hover:bg-purple-500">
              Buscar por marca
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-6 xl:grid-cols-[1fr_1.15fr]">
        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-[2rem] border border-purple-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">1. Mis vehículos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Añade tu coche primero para calcular ahorro real y autonomía.
            </p>

            {vehicles.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => selectVehicle(vehicle.id)}
                      className={selectedVehicleId === vehicle.id ? "rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"}
                    >
                      {vehicle.name}
                    </button>
                  ))}
                </div>

                {selectedVehicle && (
                  <div className="mt-4 rounded-3xl bg-purple-50 p-4 text-sm">
                    <p>Combustible: <strong>{selectedVehicle.fuel}</strong></p>
                    <p>Depósito: <strong>{selectedVehicle.tankLiters} L</strong></p>
                    <p>Consumo: <strong>{selectedVehicle.consumption} L/100 km</strong></p>
                    {fullTankCost !== null && <p className="mt-3 font-black text-emerald-700">Llenar en la mejor: {fullTankCost.toFixed(2)} €</p>}
                    {rangeKm !== null && <p className="font-black text-blue-700">Autonomía estimada: {rangeKm.toFixed(0)} km</p>}
                    <button onClick={deleteSelectedVehicle} className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100">
                      Eliminar vehículo
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 rounded-3xl bg-slate-50 p-4">
              <h3 className="mb-4 font-black">Añadir vehículo</h3>
              <div className="space-y-3">
                <input value={newVehicleName} onChange={(e) => setNewVehicleName(e.target.value)} placeholder="Nombre: Golf, Ibiza, Moto..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                <div>
                  <p className="mb-2 text-sm font-black text-slate-700">Combustible</p>
                  <div className="flex flex-wrap gap-2">
                    {fuelOptions.slice(0, 5).map((option) => (
                      <button key={option.value} onClick={() => setNewVehicleFuel(option.value)} className={newVehicleFuel === option.value ? "rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white" : "rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-100"}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="number" value={newVehicleTank} onChange={(e) => setNewVehicleTank(Number(e.target.value))} placeholder="Depósito L" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                  <input type="number" step="0.1" value={newVehicleConsumption} onChange={(e) => setNewVehicleConsumption(Number(e.target.value))} placeholder="L/100 km" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                </div>
                <button onClick={addVehicle} className="w-full rounded-2xl bg-purple-600 px-4 py-3 font-black text-white hover:bg-purple-500">
                  Guardar vehículo
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 text-center">
              <p className="text-sm font-black text-emerald-600">2. Buscar</p>
              <h2 className="mt-1 text-2xl font-black">Configura tu búsqueda</h2>
              <p className="mt-1 text-sm text-slate-500">Sin desplegables: escribe o usa botones rápidos.</p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-black text-slate-800">Combustible</p>
                <div className="flex flex-wrap gap-2">
                  {fuelOptions.map((option) => (
                    <button key={option.value} onClick={() => setFuel(option.value)} className={fuel === option.value ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div id="marca">
                <AutocompleteInput label="Marca" value={brand} onChange={setBrand} onSelect={setBrand} placeholder="Ej: Repsol, Moeve, Galp, BP..." suggestions={brandSuggestions} helper="Puedes escribir cualquier marca o dejarlo vacío." />
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
                <h2 className="mb-3 font-black">Buscar cerca de una dirección</h2>
                <input value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} placeholder="Ej: Calle Serrano 45, Madrid" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />

                <div className="mt-4">
                  <p className="mb-2 text-sm font-black text-slate-800">Radio</p>
                  <div className="flex flex-wrap gap-2">
                    {radiusOptions.map((radius) => (
                      <button key={radius} onClick={() => setSearchRadiusKm(radius)} className={searchRadiusKm === radius ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-50"}>
                        {radius} km
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => searchByAddress()} className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg hover:bg-blue-500">
                  Buscar cerca de esta dirección
                </button>
              </div>

              <AutocompleteInput label="Provincia" value={province} onChange={setProvince} onSelect={setProvince} placeholder="Ej: Madrid" suggestions={provinces} />
              <AutocompleteInput label="Municipio" value={municipality} onChange={setMunicipality} onSelect={setMunicipality} placeholder="Ej: Alcobendas" suggestions={municipalities} />

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">Litros del depósito</label>
                <input type="number" value={liters} onChange={(e) => setLiters(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => loadRanking()} className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-lg hover:bg-emerald-400">
                  Buscar ranking
                </button>
                <button onClick={() => loadNearby()} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white shadow-lg hover:bg-slate-800">
                  Usar mi ubicación
                </button>
              </div>
            </div>
          </section>

          <FuelAssistant stations={stations} selectedVehicle={selectedVehicle} fuel={fuel} brand={brand} province={province} municipality={municipality} />
        </aside>

        <section className="space-y-5">
          {cheapest && (
            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-black text-emerald-700">Mejor opción actual</p>
              <h3 className="mt-2 text-xl font-black">{cheapest.name}</h3>
              <p className="text-sm text-slate-600">{cheapest.address}, {cheapest.municipality}</p>
              <p className="mt-3 text-3xl font-black text-emerald-700">{Number(cheapest.price).toFixed(3)} €/L</p>
              {estimatedSaving !== null && <p className="mt-2 text-sm text-slate-700">Ahorro estimado frente a la media mostrada: <strong>{estimatedSaving.toFixed(2)} €</strong></p>}
            </section>
          )}

          <div className="h-[540px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:h-[620px]">
            {stations.length > 0 ? (
              <GasMap stations={stations} userLocation={userLocation} />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <p className="text-2xl font-black text-slate-900">Busca una zona para ver el mapa</p>
                  <p className="mt-2 text-slate-500">Usa el modo rápido, tu ubicación o los buscadores de provincia, municipio y marca.</p>
                </div>
              </div>
            )}
          </div>

          {favoriteStations.length > 0 && (
            <section className="rounded-[2rem] border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-black text-yellow-900">Gasolineras favoritas</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {favoriteStations.slice(0, 4).map((station) => (
                  <div key={station.id} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                    <p className="font-black">{station.name}</p>
                    <p className="text-slate-500">{station.municipality}, {station.province}</p>
                    <p className="mt-1 font-black text-emerald-700">{Number(station.price).toFixed(3)} €/L</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Gasolineras encontradas</h2>
                <p className="text-sm text-slate-500">Ordenadas por precio dentro de tu búsqueda.</p>
              </div>
              {loading && <p className="text-sm font-black text-emerald-600">Cargando...</p>}
            </div>

            <div className="grid gap-4">
              {stations.map((station, index) => (
                <StationCard key={station.id} station={station} index={index} averagePrice={averagePrice} selectedVehicle={selectedVehicle} isFavorite={favoriteStationIds.includes(station.id)} onToggleFavorite={toggleFavoriteStation} />
              ))}

              {stations.length === 0 && !loading && (
                <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                  Todavía no hay resultados. Prueba el modo rápido, busca por dirección o escribe una provincia.
                </p>
              )}
            </div>
          </div>
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl">
          Datos obtenidos del Geoportal de Hidrocarburos / MITECO. Esta web no pertenece ni está afiliada al Gobierno de España. Los precios pueden variar y deben verificarse en la estación de servicio.
        </div>
      </footer>
    </main>
  );
}
