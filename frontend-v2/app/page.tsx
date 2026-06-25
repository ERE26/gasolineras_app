"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopNav from "./components/TopNav";

const GasMap = dynamic(() => import("./components/GasMap"), {
  ssr: false,
});

type Summary = {
  totalStations: number;
  totalPrices: number;
  lastUpdate: string | null;
};

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-ES");
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapStations, setCheapStations] = useState<Station[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Permite ubicación para ranking cercano");
  const [rankingLabel, setRankingLabel] = useState("Muestra general");

  async function loadSummary() {
    try {
      const summaryResponse = await fetch(`${API_URL}/api/summary`);
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);
    } catch (error) {
      console.error("Error cargando resumen:", error);
    }
  }

  async function loadGeneralRanking() {
    try {
      const rankingResponse = await fetch(
        `${API_URL}/api/ranking?fuel=gasolina95&limit=5`
      );
      const rankingData = await rankingResponse.json();
      setCheapStations(Array.isArray(rankingData) ? rankingData : []);
      setRankingLabel("Muestra general");
    } catch (error) {
      console.error("Error cargando ranking inicial:", error);
    }
  }

  async function loadNearbyRanking(lat: number, lon: number, radiusKm: number) {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        fuel: "gasolina95",
        radius: String(radiusKm * 1000),
        limit: "6",
      });

      const response = await fetch(`${API_URL}/api/nearby?${params.toString()}`);
      const data = await response.json();

      const stations = Array.isArray(data) ? data : [];

      if (stations.length < 4 && radiusKm === 1) {
        return loadNearbyRanking(lat, lon, 5);
      }

      if (stations.length > 0) {
        setCheapStations(stations);
        setRankingLabel(`Cerca de ti · ${radiusKm} km`);
      } else {
        await loadGeneralRanking();
      }
    } catch (error) {
      console.error("Error cargando ranking cercano:", error);
      await loadGeneralRanking();
    }
  }

  useEffect(() => {
    loadSummary();

    if (!navigator.geolocation) {
      setLocationStatus("Ubicación no disponible");
      loadGeneralRanking();
      return;
    }

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

        setLocationStatus("Ranking calculado con tu ubicación actual");
        loadNearbyRanking(coords.lat, coords.lon, 1);
      },
      () => {
        setLocationStatus("Activa tu ubicación para obtener el ranking personalizado");
        loadGeneralRanking();
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  }, []);

  const topStations = useMemo(() => cheapStations.slice(0, 4), [cheapStations]);

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#a7f3d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),radial-gradient(circle_at_bottom_right,#fef3c7,transparent_28%),linear-gradient(135deg,#f8fbff,#eef6ff)]" />

        <div className="relative mx-auto grid max-w-7xl items-start gap-8 px-6 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
              ⛽ Datos oficiales · 📍 Ubicación en tiempo real
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Ahorra al repostar cerca de ti o en tu ruta.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Compara precios oficiales, encuentra gasolineras cercanas y planifica paradas de repostaje sin desviarte de más.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center rounded-[1.55rem] bg-emerald-500 px-7 py-5 text-lg font-black text-white shadow-xl shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Buscar gasolineras cerca de mí
              </Link>

              <Link
                href="/planificar-viaje"
                className="inline-flex items-center justify-center rounded-[1.55rem] border border-blue-100 bg-white px-7 py-5 text-lg font-black text-blue-700 shadow-sm hover:bg-blue-50"
              >
                Planificar viaje
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                {summary?.totalStations
                  ? `${summary.totalStations.toLocaleString("es-ES")} estaciones`
                  : "Estaciones oficiales"}
              </span>

              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Actualizado: {formatDateOnly(summary?.lastUpdate)}
              </span>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700 shadow-sm">
                {locationStatus}
              </span>
            </div>
          </div>

          <div className="self-start rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/70">
            <p className="text-sm font-black text-emerald-600">Cómo funciona Rivvo</p>
            <h2 className="mt-1 text-2xl font-black">Todo lo importante en 3 acciones</h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/buscar"
                className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="text-lg font-black">1. Busca gasolineras cerca de ti</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Usa tu ubicación o escribe una dirección para obtener los mejores precios.
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/mis-vehiculos"
                className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🚗</span>
                  <div>
                    <h3 className="text-lg font-black">2. Análisi personalizado </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Añade tus vehículos para obtener así un analisis personalizado .
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/planificar-viaje"
                className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🗺️</span>
                  <div>
                    <h3 className="text-lg font-black">3. Planifica tu viaje</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Elige origen, destino y cuándo quieres parar. Te proponemos las mejores estaciones para tu ruta.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Vista rápida · {rankingLabel}</p>
          <h2 className="mt-1 text-2xl font-black">
            Gasolineras baratas detectadas
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Activa tu ubicación para ver el ranking de las gasolineras mas baratas cerca de ti. Si no, se muestra
            una referencia general.
          </p>

          <div className="mt-5 grid gap-3">
            {topStations.map((station, index) => (
              <div
                key={station.id}
                className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4"
              >
                <div>
                  <p className="text-xs font-black text-slate-500">
                    #{index + 1} · {station.municipality}, {station.province}
                  </p>
                  <p className="font-black">{station.name}</p>
                  <p className="text-sm text-slate-500">
                    {station.brand || "Marca no indicada"}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500 px-4 py-3 text-right text-white">
                  <p className="text-lg font-black">
                    {Number(station.price).toFixed(3)} €
                  </p>
                  <p className="text-xs font-bold">por litro</p>
                </div>
              </div>
            ))}

            {topStations.length === 0 && (
              <p className="rounded-3xl bg-slate-50 p-5 text-slate-500">
                Cargando gasolineras...
              </p>
            )}
          </div>
        </div>

        <div className="h-[430px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <GasMap stations={topStations} userLocation={userLocation} />
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
