"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AutocompleteInput from "../components/AutocompleteInput";
import StationCard from "../components/StationCard";
import TopNav from "../components/TopNav";

const GasMap = dynamic(() => import("../components/GasMap"), { ssr: false });

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

const popularBrands = ["REPSOL", "MOEVE", "CEPSA", "GALP", "BP", "SHELL", "PLENOIL", "BALLENOIL", "PETROPRIX"];

const majorCities = [
  "madrid",
  "barcelona",
  "valencia",
  "sevilla",
  "zaragoza",
  "malaga",
  "málaga",
  "murcia",
  "palma",
  "las palmas de gran canaria",
  "bilbao",
  "alicante",
  "cordoba",
  "córdoba",
  "valladolid",
  "vigo",
  "gijon",
  "gijón",
  "granada",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getAddressArea(address: any) {
  const municipality =
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    address?.county ||
    "";

  const label =
    address?.suburb ||
    address?.city_district ||
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    "tu zona";

  const normalizedMunicipality = normalize(String(municipality));
  const isMajorCity = majorCities.some((city) => normalize(city) === normalizedMunicipality);

  return {
    label: String(label),
    municipality: String(municipality || label),
    isMajorCity,
  };
}

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [brand, setBrand] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>(popularBrands);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [favoriteStationIds, setFavoriteStationIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [contextText, setContextText] = useState("");
  const [referencePrice, setReferencePrice] = useState<number | null>(null);

  async function loadFilters(selectedProvince?: string) {
    try {
      const params = new URLSearchParams();
      if (selectedProvince) params.append("province", selectedProvince);
      const response = await fetch(`${API_URL}/api/filters?${params.toString()}`);
      const data = await response.json();
      setProvinces(data.provinces || []);
      setMunicipalities(data.municipalities || []);
    } catch {
      setProvinces([]);
      setMunicipalities([]);
    }
  }

  async function loadBrands(search: string) {
    try {
      const response = await fetch(`${API_URL}/api/brands?search=${encodeURIComponent(search)}&limit=12`);
      const data = await response.json();
      setBrandSuggestions(Array.from(new Set([...popularBrands, ...(Array.isArray(data) ? data : [])])));
    } catch {
      setBrandSuggestions(popularBrands);
    }
  }

  function loadStorage() {
    const savedVehicles = localStorage.getItem("myVehicles");
    if (savedVehicles) {
      const parsed: Vehicle[] = JSON.parse(savedVehicles);
      setVehicles(parsed);
      if (parsed.length > 0) {
        setSelectedVehicleId(parsed[0].id);
        setFuel(parsed[0].fuel);
      }
    }
    const savedFavorites = localStorage.getItem("favoriteStations");
    if (savedFavorites) setFavoriteStationIds(JSON.parse(savedFavorites));
  }

  function saveFavorites(nextFavorites: number[]) {
    setFavoriteStationIds(nextFavorites);
    localStorage.setItem("favoriteStations", JSON.stringify(nextFavorites));
  }

  function toggleFavoriteStation(stationId: number) {
    saveFavorites(
      favoriteStationIds.includes(stationId)
        ? favoriteStationIds.filter((id) => id !== stationId)
        : [...favoriteStationIds, stationId]
    );
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (vehicle) setFuel(vehicle.fuel);
  }

  async function fetchNearby(lat: number, lon: number, radiusKm: number, selectedFuel = fuel) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      fuel: selectedFuel,
      radius: String(radiusKm * 1000),
      limit: "25",
    });
    if (brand.trim()) params.append("brand", brand.trim());
    const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadReference(municipalityName: string, selectedFuel = fuel) {
    if (!municipalityName) return null;
    try {
      const params = new URLSearchParams({ fuel: selectedFuel, municipality: municipalityName, limit: "80" });
      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();
      const prices = Array.isArray(data)
        ? data.map((item: Station) => Number(item.price)).filter(Number.isFinite)
        : [];
      if (!prices.length) return null;
      return prices.reduce((acc: number, price: number) => acc + price, 0) / prices.length;
    } catch {
      return null;
    }
  }

  async function reverseGeocode(lat: number, lon: number) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return getAddressArea(data.address || {});
  }

  async function runSmartNearby(
    lat: number,
    lon: number,
    sourceLabel: string,
    selectedFuel = fuel,
    areaFromSearch?: { label: string; municipality: string; isMajorCity: boolean }
  ) {
    setLoading(true);
    try {
      const area = areaFromSearch || (await reverseGeocode(lat, lon));
      const firstRadius = area.isMajorCity ? 1 : 5;
      let chosenRadius = firstRadius;
      let nearby = await fetchNearby(lat, lon, firstRadius, selectedFuel);
      let reason = area.isMajorCity
        ? "zona urbana: se ha usado 1 km"
        : "zona amplia o afueras: se ha usado 5 km";

      if (area.isMajorCity && nearby.length < 5) {
        chosenRadius = 5;
        nearby = await fetchNearby(lat, lon, 5, selectedFuel);
        reason = "zona con pocas estaciones a 1 km: se ha ampliado a 5 km";
      }

      const reference = await loadReference(area.municipality, selectedFuel);
      setStations(nearby);
      setUserLocation({ lat, lon });
      setReferencePrice(reference);
      setContextText(`${sourceLabel || area.label} · radio ${chosenRadius} km · ${reason}`);

      localStorage.setItem(
        "lastFuelSearchContext",
        JSON.stringify({
          fuel: selectedFuel,
          brand,
          area,
          areaInfo: { ...area, chosenRadiusKm: chosenRadius, reason },
          userLocation: { lat, lon },
          referencePrice: reference,
          stations: nearby.slice(0, 10),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(error);
      alert("Error buscando gasolineras cercanas.");
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${query}`
      );
      const data = await response.json();
      if (!data?.length) {
        alert("No he encontrado esa dirección.");
        setLoading(false);
        return;
      }
      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);
      const area = getAddressArea(data[0].address || {});
      setLoading(false);
      await runSmartNearby(lat, lon, searchAddress.trim(), fuel, area);
    } catch {
      alert("Error buscando por dirección.");
      setLoading(false);
    }
  }

  async function loadNearby(selectedFuel = fuel) {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite geolocalización.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoading(false);
        await runSmartNearby(position.coords.latitude, position.coords.longitude, "tu ubicación", selectedFuel);
      },
      () => {
        alert("No se ha podido obtener tu ubicación.");
        setLoading(false);
      }
    );
  }

  async function loadManualRanking() {
    if (!province.trim() && !municipality.trim() && !brand.trim()) {
      await loadNearby(fuel);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ fuel, limit: "25" });
      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) params.append("municipality", municipality.trim());
      if (brand.trim()) params.append("brand", brand.trim());
      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();
      const nextStations = Array.isArray(data) ? data : [];
      setStations(nextStations);
      setUserLocation(null);
      setContextText(`ranking manual · ${municipality || province || brand}`);
      const prices = nextStations.map((item) => Number(item.price)).filter(Number.isFinite);
      setReferencePrice(prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null);
    } catch {
      alert("Error cargando el ranking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilters();
    loadStorage();
  }, []);

  useEffect(() => {
    loadFilters(province || undefined);
    setMunicipality("");
  }, [province]);

  useEffect(() => {
    const timeout = setTimeout(() => loadBrands(brand), 250);
    return () => clearTimeout(timeout);
  }, [brand]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const visibleAveragePrice = useMemo(() => {
    if (referencePrice !== null) return referencePrice;
    const prices = stations.map((station) => Number(station.price)).filter(Number.isFinite);
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  }, [referencePrice, stations]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-blue-600">Búsqueda principal</p>
              <h1 className="mt-1 text-2xl font-black">Busca una zona concreta</h1>
              <p className="mt-1 text-sm text-slate-500">
                Escribe una dirección o usa tu ubicación. El radio se ajusta solo:
                1 km si hay muchas opciones cerca, 5 km si estás en afueras.
              </p>

              <div className="mt-5 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
                <h2 className="mb-3 font-black">Dirección o zona</h2>
                <input
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Ej: Calle Serrano 45, Madrid"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  onClick={searchByAddress}
                  className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg hover:bg-blue-500"
                >
                  Buscar en esta zona
                </button>

                <button
                  onClick={() => loadNearby(fuel)}
                  className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white shadow-lg hover:bg-slate-800"
                >
                  Usar mi ubicación
                </button>
              </div>

              {contextText && (
                <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
                  {contextText}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-emerald-600">Modo rápido</p>
              <h2 className="mt-1 text-xl font-black">Atajos útiles</h2>
              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => {
                    setFuel("gasolina95");
                    loadNearby("gasolina95");
                  }}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white shadow-sm hover:bg-slate-800"
                >
                  Gasolina 95 cerca de mí
                </button>
                <button
                  onClick={() => {
                    setFuel("diesel");
                    loadNearby("diesel");
                  }}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-left text-sm font-black text-white shadow-sm hover:bg-blue-500"
                >
                  Diésel cerca de mí
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black text-blue-600">Configura tu búsqueda</p>
              <h2 className="mt-1 text-2xl font-black">Filtros y cálculo</h2>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-black text-slate-800">Combustible</p>
                  <div className="flex flex-wrap gap-2">
                    {fuelOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFuel(option.value)}
                        className={
                          fuel === option.value
                            ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                            : "rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {vehicles.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-black text-slate-800">
                      Calcular con vehículo guardado
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => selectVehicle(vehicle.id)}
                          className={
                            selectedVehicleId === vehicle.id
                              ? "rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white"
                              : "rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"
                          }
                        >
                          {vehicle.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-purple-50 p-4 text-sm text-purple-900">
                    No tienes vehículos guardados todavía. Puedes añadirlos en{" "}
                    <Link href="/mis-vehiculos" className="font-black underline">
                      Mis vehículos
                    </Link>
                    .
                  </div>
                )}

                <AutocompleteInput
                  label="Marca"
                  value={brand}
                  onChange={setBrand}
                  onSelect={setBrand}
                  placeholder="Ej: Repsol, Moeve, Galp, BP..."
                  suggestions={brandSuggestions}
                  helper="Puedes escribir cualquier marca o dejarlo vacío."
                />

                <AutocompleteInput
                  label="Provincia"
                  value={province}
                  onChange={setProvince}
                  onSelect={setProvince}
                  placeholder="Ej: Madrid"
                  suggestions={provinces}
                />

                <AutocompleteInput
                  label="Municipio"
                  value={municipality}
                  onChange={setMunicipality}
                  onSelect={setMunicipality}
                  placeholder="Ej: Alcobendas"
                  suggestions={municipalities}
                />

                <button
                  onClick={loadManualRanking}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-lg hover:bg-emerald-400"
                >
                  Buscar con estos filtros
                </button>
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            <div className="h-[560px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <GasMap stations={stations} userLocation={userLocation} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Gasolineras encontradas</h2>
                  <p className="text-sm text-slate-500">
                    Ordenadas por precio dentro de tu búsqueda.
                  </p>
                </div>
                {loading && <p className="text-sm font-black text-emerald-600">Cargando...</p>}
              </div>

              <div className="grid gap-4">
                {stations.map((station, index) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    index={index}
                    averagePrice={visibleAveragePrice}
                    selectedVehicle={selectedVehicle}
                    isFavorite={favoriteStationIds.includes(station.id)}
                    onToggleFavorite={toggleFavoriteStation}
                  />
                ))}

                {stations.length === 0 && !loading && (
                  <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                    Todavía no hay resultados. Busca por dirección, usa tu ubicación
                    o escribe una provincia/municipio.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl">
          Datos obtenidos del Geoportal de Hidrocarburos / MITECO. Esta web no pertenece
          ni está afiliada al Gobierno de España. Los precios pueden variar y deben
          verificarse en la estación de servicio.
        </div>
      </footer>
    </main>
  );
}
