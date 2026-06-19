"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AutocompleteInput from "../components/AutocompleteInput";
import StationCard from "../components/StationCard";
import TopNav from "../components/TopNav";

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
  captured_at?: string;
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

type AddressSuggestion = {
  label: string;
  lat: number;
  lon: number;
  area: {
    label: string;
    municipality: string;
    isMajorCity: boolean;
  };
};

type AreaInfo = {
  label: string;
  municipality: string;
  isMajorCity: boolean;
  chosenRadiusKm: number;
  reason: string;
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

const mainBrands = ["REPSOL", "MOEVE", "GALP", "BP", "DISA", "SHELL", "BALLENOIL", "PLENERGY"];
const brandOptions = [...mainBrands, "OTRA"];

function isMainBrandStation(station: { brand?: string; name?: string }) {
  const text = `${station.brand || ""} ${station.name || ""}`.toUpperCase();
  return mainBrands.some((brand) => text.includes(brand));
}

function stationMatchesOneBrand(station: { brand?: string; name?: string }, selectedBrand: string) {
  if (selectedBrand === "OTRA") {
    return !isMainBrandStation(station);
  }

  const text = `${station.brand || ""} ${station.name || ""}`.toUpperCase();
  return text.includes(selectedBrand);
}

function filterByBrandSelections<T extends { brand?: string; name?: string }>(items: T[], selectedBrands: string[]) {
  if (selectedBrands.length === 0) return items;

  return items.filter((item) =>
    selectedBrands.some((selectedBrand) => stationMatchesOneBrand(item, selectedBrand))
  );
}

function getApiBrandFilter(selectedBrands: string[]) {
  if (selectedBrands.length === 1 && selectedBrands[0] !== "OTRA") {
    return selectedBrands[0];
  }

  return "";
}

type FavoriteStation = Station | {
  id: number | string;
  name: string;
  brand?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: string;
  fuel_type?: string;
  municipality?: string;
  province?: string;
};

const majorCities = [
  "madrid", "barcelona", "valencia", "sevilla", "zaragoza", "malaga", "málaga",
  "murcia", "palma", "bilbao", "alicante", "valladolid", "vigo", "gijon",
  "gijón", "granada", "elche", "oviedo", "cartagena", "sabadell", "mostoles",
  "móstoles", "santa cruz de tenerife",
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
    address?.road ||
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

function getViewbox(lat: number, lon: number) {
  const delta = 0.35;
  return `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
}

export default function SearchPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fuel, setFuel] = useState("gasolina95");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [favoriteMenuOpen, setFavoriteMenuOpen] = useState(false);
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false);
  const [otherFuelMenuOpen, setOtherFuelMenuOpen] = useState(false);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const [searchAddress, setSearchAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [favoriteStationIds, setFavoriteStationIds] = useState<Array<number | string>>([]);
  const [favoriteStationsFull, setFavoriteStationsFull] = useState<FavoriteStation[]>([]);

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [referencePrice, setReferencePrice] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<"price" | "distance">("price");

  async function requestUserLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        setUserLocation(coords);
        localStorage.setItem(
          "lastUserLocation",
          JSON.stringify({ ...coords, updatedAt: new Date().toISOString() })
        );
      },
      () => {
        const saved = localStorage.getItem("lastUserLocation");
        if (!saved) return;
        try {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lon) {
            setUserLocation({ lat: parsed.lat, lon: parsed.lon });
          }
        } catch {}
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
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

  function toggleBrandSelection(selectedBrand: string) {
    setSelectedBrands((currentBrands) => {
      const exists = currentBrands.includes(selectedBrand);

      if (exists) {
        return currentBrands.filter((brand) => brand !== selectedBrand);
      }

      return [...currentBrands, selectedBrand];
    });
  }

  function clearBrandSelection() {
    setSelectedBrands([]);
  }

  async function loadAddressSuggestions(query: string) {
    if (!query.trim() || query.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (selectedAddress && selectedAddress.label === query) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "es",
        q: query,
      });

      if (userLocation) {
        params.set("viewbox", getViewbox(userLocation.lat, userLocation.lon));
        params.set("bounded", "0");
      }

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const data = await response.json();

      const suggestions: AddressSuggestion[] = Array.isArray(data)
        ? data.map((item: any) => ({
            label: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            area: getAddressArea(item.address || {}),
          }))
        : [];

      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error("Error cargando sugerencias de dirección:", error);
      setAddressSuggestions([]);
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
    }
  }

  function loadFavoritesFromStorage() {
    const savedFull = localStorage.getItem("favoriteStationsFull");
    if (savedFull) {
      try {
        const parsed: FavoriteStation[] = JSON.parse(savedFull);
        setFavoriteStationsFull(parsed);
        setFavoriteStationIds(parsed.map((item) => item.id));
        return;
      } catch {}
    }

    const saved = localStorage.getItem("favoriteStations");
    if (!saved) return;

    try {
      const ids = JSON.parse(saved);
      setFavoriteStationIds(ids);
    } catch {}
  }

  function saveFavorites(nextFavorites: FavoriteStation[]) {
    setFavoriteStationsFull(nextFavorites);
    setFavoriteStationIds(nextFavorites.map((item) => item.id));
    localStorage.setItem("favoriteStationsFull", JSON.stringify(nextFavorites));
    localStorage.setItem("favoriteStations", JSON.stringify(nextFavorites.map((item) => item.id)));
  }

  function toggleFavoriteStation(station: Station) {
    const exists = favoriteStationIds.some((id) => String(id) === String(station.id));

    if (exists) {
      saveFavorites(favoriteStationsFull.filter((item) => String(item.id) !== String(station.id)));
      return;
    }

    saveFavorites([...favoriteStationsFull, { ...station }]);
  }

  function normalizeFavoriteToStation(favorite: FavoriteStation): Station | null {
    if (!favorite.price || !favorite.latitude || !favorite.longitude) {
      return null;
    }

    return {
      id: typeof favorite.id === "number" ? favorite.id : Date.now(),
      name: favorite.name,
      brand: favorite.brand || "Favorita",
      address: favorite.address || "Dirección no indicada",
      province: favorite.province || "",
      municipality: favorite.municipality || "",
      latitude: favorite.latitude,
      longitude: favorite.longitude,
      price: favorite.price,
      fuel_type: favorite.fuel_type || fuel,
      captured_at: (favorite as Partial<Station>).captured_at,
      distance_meters: (favorite as Partial<Station>).distance_meters,
      schedule: (favorite as Partial<Station>).schedule,
    };
  }

  function selectFavoriteStation(favorite: FavoriteStation) {
    const station = normalizeFavoriteToStation(favorite);

    if (!station) {
      alert("Esta favorita no tiene precio guardado todavía. Búscala de nuevo desde Favoritas o desde el buscador para guardar sus datos completos.");
      return;
    }

    setSelectedFavoriteId(String(favorite.id));
    setFavoriteOnly(true);
    setStations([station]);
    setReferencePrice(null);
    setAreaInfo({
      label: favorite.name,
      municipality: station.municipality || favorite.name,
      isMajorCity: false,
      chosenRadiusKm: 0,
      reason: "mostrando solo esta gasolinera favorita, sin compararla con otras",
    });

    localStorage.setItem(
      "lastFuelSearchContext",
      JSON.stringify({
        fuel: station.fuel_type,
        brands: selectedBrands,
        brand: selectedBrands.join(", "),
        area: { label: favorite.name, municipality: station.municipality },
        areaInfo: {
          label: favorite.name,
          municipality: station.municipality,
          chosenRadiusKm: 0,
          reason: "favorita seleccionada directamente",
        },
        userLocation,
        referencePrice: null,
        stations: [station],
        favoriteOnly: true,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  function selectVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    setFuel(vehicle.fuel);
  }

  async function fetchNearby(lat: number, lon: number, radiusKm: number, selectedFuel = fuel) {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      fuel: selectedFuel,
      radius: String(radiusKm * 1000),
      limit: selectedBrands.length > 0 ? "120" : "25",
    });

    const apiBrand = getApiBrandFilter(selectedBrands);
    if (apiBrand) {
      params.append("brand", apiBrand);
    }

    const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
    const data = await response.json();

    const result = Array.isArray(data) ? data : [];
    return filterByBrandSelections(result, selectedBrands).slice(0, 25);
  }

  async function loadReferenceForMunicipality(areaName: string, selectedFuel = fuel) {
    if (!areaName || areaName === "tu zona") return null;

    try {
      const params = new URLSearchParams({
        fuel: selectedFuel,
        municipality: areaName,
        limit: selectedBrands.length > 0 ? "150" : "80",
      });

      const apiBrand = getApiBrandFilter(selectedBrands);
      if (apiBrand) {
        params.append("brand", apiBrand);
      }

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();

      const filteredStations = filterByBrandSelections(Array.isArray(data) ? data : [], selectedBrands);
      const prices = filteredStations
        .map((item: Station) => Number(item.price))
        .filter(Number.isFinite);

      if (prices.length === 0) return null;

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
      let radiusToUse = firstRadius;
      let reason = area.isMajorCity
        ? "zona urbana: buscamos primero en 1 km"
        : "zona amplia o afueras: usamos 5 km";

      let nearby = await fetchNearby(lat, lon, firstRadius, selectedFuel);

      if (area.isMajorCity && nearby.length < 5) {
        radiusToUse = 5;
        reason = "había pocas estaciones en 1 km, ampliamos a 5 km";
        nearby = await fetchNearby(lat, lon, 5, selectedFuel);
      }

      const reference = await loadReferenceForMunicipality(area.municipality, selectedFuel);

      setFavoriteOnly(false);
      setSelectedFavoriteId(null);
      setStations(nearby);
      setUserLocation({ lat, lon });
      setReferencePrice(reference);
      setAreaInfo({
        label: sourceLabel || area.label,
        municipality: area.municipality,
        isMajorCity: area.isMajorCity,
        chosenRadiusKm: radiusToUse,
        reason,
      });

      localStorage.setItem(
        "lastFuelSearchContext",
        JSON.stringify({
          fuel: selectedFuel,
          brands: selectedBrands,
          brand: selectedBrands.join(", "),
          area,
          areaInfo: {
            label: sourceLabel || area.label,
            municipality: area.municipality,
            isMajorCity: area.isMajorCity,
            chosenRadiusKm: radiusToUse,
            reason,
          },
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
    if (selectedAddress) {
      await runSmartNearby(selectedAddress.lat, selectedAddress.lon, selectedAddress.label, fuel, selectedAddress.area);
      return;
    }

    if (!searchAddress.trim()) {
      alert("Escribe una dirección o zona.");
      return;
    }

    if (addressSuggestions.length > 0) {
      const first = addressSuggestions[0];
      setSelectedAddress(first);
      setSearchAddress(first.label);
      setAddressSuggestions([]);
      await runSmartNearby(first.lat, first.lon, first.label, fuel, first.area);
      return;
    }

    alert("Elige una dirección sugerida para evitar resultados lejos de tu ubicación.");
  }

  async function loadNearby(selectedFuel = fuel) {
    if (userLocation) {
      await runSmartNearby(userLocation.lat, userLocation.lon, "tu ubicación", selectedFuel);
      return;
    }

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
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  }

  async function loadManualRanking() {
    const hasAreaFilter = Boolean(province.trim() || municipality.trim());

    // Si el usuario ya había buscado por ubicación o por una dirección concreta,
    // aplicar filtros debe mantener esa misma ubicación como referencia.
    // Solo saltamos a ranking por zona cuando se escribe provincia o municipio.
    if (!hasAreaFilter) {
      if (userLocation) {
        await runSmartNearby(
          userLocation.lat,
          userLocation.lon,
          areaInfo?.label || "ubicación actual",
          fuel,
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

      await loadNearby(fuel);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        fuel,
        limit: selectedBrands.length > 0 ? "120" : "25",
      });

      if (province.trim()) params.append("province", province.trim());
      if (municipality.trim()) params.append("municipality", municipality.trim());

      const apiBrand = getApiBrandFilter(selectedBrands);
      if (apiBrand) params.append("brand", apiBrand);

      const response = await fetch(`${API_URL}/api/ranking?${params.toString()}`);
      const data = await response.json();
      const nextStations = filterByBrandSelections(Array.isArray(data) ? data : [], selectedBrands).slice(0, 25);

      setFavoriteOnly(false);
      setSelectedFavoriteId(null);
      setStations(nextStations);
      setAreaInfo(null);

      const prices = nextStations.map((item) => Number(item.price)).filter(Number.isFinite);
      const avg = prices.length
        ? prices.reduce((acc, price) => acc + price, 0) / prices.length
        : null;

      setReferencePrice(avg);

      localStorage.setItem(
        "lastFuelSearchContext",
        JSON.stringify({
          fuel,
          brands: selectedBrands,
          brand: selectedBrands.join(", "),
          area: { label: municipality || province || selectedBrands.join(", ") || "ranking manual" },
          areaInfo: null,
          userLocation,
          referencePrice: avg,
          stations: nextStations.slice(0, 10),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error(error);
      alert("Error cargando el ranking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilters();
    loadVehiclesFromStorage();
    loadFavoritesFromStorage();
    requestUserLocation();
  }, []);

  useEffect(() => {
    loadFilters(province || undefined);
    setMunicipality("");
  }, [province]);


  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedAddress && selectedAddress.label === searchAddress) {
        setAddressSuggestions([]);
        return;
      }

      loadAddressSuggestions(searchAddress);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchAddress, userLocation, selectedAddress]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const visibleAveragePrice = useMemo(() => {
    if (referencePrice !== null) return referencePrice;
    if (stations.length === 0) return null;

    const prices = stations
      .map((station) => Number(station.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return prices.reduce((acc, price) => acc + price, 0) / prices.length;
  }, [referencePrice, stations]);

  const sortedStations = useMemo(() => {
    const copy = [...stations];

    if (favoriteOnly) return copy;

    if (sortMode === "distance") {
      return copy.sort((a, b) => {
        const distanceA = a.distance_meters ?? Number.POSITIVE_INFINITY;
        const distanceB = b.distance_meters ?? Number.POSITIVE_INFINITY;

        if (distanceA !== distanceB) return distanceA - distanceB;

        return Number(a.price) - Number(b.price);
      });
    }

    return copy.sort((a, b) => {
      const priceDiff = Number(a.price) - Number(b.price);
      if (priceDiff !== 0) return priceDiff;

      return (a.distance_meters ?? Number.POSITIVE_INFINITY) - (b.distance_meters ?? Number.POSITIVE_INFINITY);
    });
  }, [stations, sortMode, favoriteOnly]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative z-[1200] mb-4 grid items-start gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-blue-600">Centro de búsqueda</p>
                <h1 className="text-2xl font-black">Busca, filtra y compara</h1>
              </div>

              {loading && (
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  Cargando...
                </span>
              )}
            </div>

            <div className="relative mt-3">
              <input
                value={searchAddress}
                onChange={(e) => {
                  setSearchAddress(e.target.value);
                  setSelectedAddress(null);
                }}
                placeholder="Ej: Calle Serrano 45, Madrid"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />

              {searchAddress.trim().length >= 3 && addressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[54px] z-[2800] max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {addressSuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lon}-${suggestion.label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSelectedAddress(suggestion);
                        setSearchAddress(suggestion.label);
                        setAddressSuggestions([]);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                onClick={searchByAddress}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white shadow-sm hover:bg-blue-500"
              >
                Buscar esta zona
              </button>

              <button
                onClick={() => loadNearby(fuel)}
                className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white shadow-sm hover:bg-slate-800"
              >
                Usar mi ubicación
              </button>

              <button
                onClick={loadManualRanking}
                className="rounded-2xl bg-emerald-500 px-4 py-3 font-black text-white shadow-sm hover:bg-emerald-400"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          <div className="self-start rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Combustible</p>
            <div className="flex flex-wrap gap-2">
              {fuelOptions.slice(0, 4).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFuel(option.value)}
                  className={
                    fuel === option.value
                      ? "rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white"
                      : "rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-[1100] mb-4 rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="relative">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Marcas</p>

              <button
                type="button"
                onClick={() => setBrandMenuOpen((open) => !open)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
              >
                {selectedBrands.length > 0 ? selectedBrands.join(", ") : "Todas las marcas"}
              </button>

              {brandMenuOpen && (
                <div className="absolute left-0 right-0 top-[76px] z-[2800] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {brandOptions.map((brandOption) => {
                    const selected = selectedBrands.includes(brandOption);

                    return (
                      <button
                        key={brandOption}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => toggleBrandSelection(brandOption)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                      >
                        <span>{brandOption}</span>
                        <span className={selected ? "text-blue-600" : "text-slate-300"}>
                          {selected ? "✓" : "○"}
                        </span>
                      </button>
                    );
                  })}

                  {selectedBrands.length > 0 && (
                    <button
                      type="button"
                      onClick={clearBrandSelection}
                      className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                    >
                      Quitar filtros de marca
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Favoritas</p>

              <button
                type="button"
                onClick={() => setFavoriteMenuOpen((open) => !open)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
              >
                {selectedFavoriteId
                  ? favoriteStationsFull.find((favorite) => String(favorite.id) === selectedFavoriteId)?.name || "Favorita seleccionada"
                  : favoriteStationsFull.length > 0
                    ? "Seleccionar favorita"
                    : "Sin favoritas guardadas"}
              </button>

              {favoriteMenuOpen && favoriteStationsFull.length > 0 && (
                <div className="absolute left-0 right-0 top-[76px] z-[2800] max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {favoriteStationsFull.map((favorite) => (
                    <button
                      key={favorite.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        selectFavoriteStation(favorite);
                        setFavoriteMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-yellow-50"
                    >
                      <span className="font-black">{favorite.name}</span>
                      {favorite.brand && <span className="ml-2 text-slate-500">· {favorite.brand}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Mis vehículos</p>

              <button
                type="button"
                onClick={() => setVehicleMenuOpen((open) => !open)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
              >
                {selectedVehicleId
                  ? vehicles.find((vehicle) => vehicle.id === selectedVehicleId)?.name || "Vehículo seleccionado"
                  : vehicles.length > 0
                    ? "Seleccionar vehículo"
                    : "Sin vehículos guardados"}
              </button>

              {vehicleMenuOpen && (
                <div className="absolute left-0 right-0 top-[76px] z-[2800] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          selectVehicle(vehicle.id);
                          setVehicleMenuOpen(false);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-purple-50"
                      >
                        <span className="font-black">{vehicle.name}</span>
                        <span className="ml-2 text-slate-500">· {vehicle.tankLiters} L · {vehicle.consumption} L/100 km</span>
                      </button>
                    ))
                  ) : (
                    <Link
                      href="/mis-vehiculos"
                      className="block px-4 py-3 text-sm font-black text-purple-700 hover:bg-purple-50"
                    >
                      Añadir vehículo
                    </Link>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen((open) => !open)}
              className="self-end rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-200"
            >
              {advancedFiltersOpen ? "Ocultar filtros" : "Más filtros"}
            </button>
          </div>

          {selectedBrands.length > 0 && (
            <p className="mt-3 text-xs font-semibold text-blue-700">
              El análisis de precio se hará solo con: {selectedBrands.join(", ")}.
            </p>
          )}
        </div>

        {advancedFiltersOpen && (
          <div className="mb-4 rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid items-start gap-4 lg:grid-cols-[.75fr_1.25fr_auto]">
              <div className="relative">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                  Otros combustibles
                </p>

                <button
                  type="button"
                  onClick={() => setOtherFuelMenuOpen((open) => !open)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  {fuelOptions.slice(4).find((option) => option.value === fuel)?.label || "GLP, GNC, GNL o hidrógeno"}
                </button>

                {otherFuelMenuOpen && (
                  <div className="absolute left-0 right-0 top-[76px] z-[2800] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {fuelOptions.slice(4).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setFuel(option.value);
                          setOtherFuelMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                      >
                        <span>{option.label}</span>
                        <span className={fuel === option.value ? "text-blue-600" : "text-slate-300"}>
                          {fuel === option.value ? "✓" : "○"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>

              <button
                type="button"
                onClick={loadManualRanking}
                className="self-end rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-400"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {areaInfo && (
          <div className="mb-4 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <strong>{areaInfo.label}</strong> · radio aplicado: <strong>{areaInfo.chosenRadiusKm} km</strong>. {areaInfo.reason}.
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(390px,.95fr)]">
          <section className="space-y-4 xl:order-2">
            <div className="h-[520px] overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[90px]">
              <GasMap stations={stations} userLocation={userLocation} />
            </div>
          </section>

          <section className="space-y-4 xl:order-1">
            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">Gasolineras encontradas</h2>
                  <p className="text-sm text-slate-500">
                    {favoriteOnly
                      ? "Mostrando solo tu gasolinera favorita, sin compararla con otras."
                      : selectedBrands.length > 0
                        ? `Ordenadas por ${sortMode === "price" ? "precio" : "distancia"} solo entre: ${selectedBrands.join(", ")}.`
                        : `Ordenadas por ${sortMode === "price" ? "precio" : "distancia"} dentro de tu búsqueda.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!favoriteOnly && stations.length > 0 && (
                    <div className="flex rounded-2xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setSortMode("price")}
                        className={
                          sortMode === "price"
                            ? "rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm"
                            : "rounded-xl px-4 py-2 text-xs font-black text-slate-700 hover:bg-white"
                        }
                      >
                        Más baratas
                      </button>

                      <button
                        type="button"
                        onClick={() => setSortMode("distance")}
                        className={
                          sortMode === "distance"
                            ? "rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm"
                            : "rounded-xl px-4 py-2 text-xs font-black text-slate-700 hover:bg-white"
                        }
                      >
                        Más cercanas
                      </button>
                    </div>
                  )}

                  {loading && (
                    <p className="text-sm font-black text-emerald-600">Cargando...</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {sortedStations.map((station, index) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    index={index}
                    averagePrice={favoriteOnly ? null : visibleAveragePrice}
                    selectedVehicle={selectedVehicle}
                    isFavorite={favoriteStationIds.some((id) => String(id) === String(station.id))}
                    onToggleFavorite={toggleFavoriteStation}
                  />
                ))}

                {stations.length === 0 && !loading && (
                  <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                    Todavía no hay resultados. Busca por dirección, usa tu ubicación o aplica filtros desde la barra superior.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
