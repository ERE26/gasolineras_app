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
  const [locationStatus, setLocationStatus] = useState("Preparando ubicación...");

  useEffect(() => {
    async function loadHomeData() {
      try {
        const summaryResponse = await fetch(`${API_URL}/api/summary`);
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      } catch (error) {
        console.error("Error cargando resumen:", error);
      }

      try {
        const rankingResponse = await fetch(
          `${API_URL}/api/ranking?fuel=gasolina95&limit=6`
        );
        const rankingData = await rankingResponse.json();
        setCheapStations(Array.isArray(rankingData) ? rankingData : []);
      } catch (error) {
        console.error("Error cargando ranking inicial:", error);
      }
    }

    loadHomeData();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Activa ubicación manualmente en el buscador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem("lastUserLocation", JSON.stringify(coords));
        setLocationStatus("Ubicación lista para recomendaciones cercanas.");
      },
      () => {
        setLocationStatus("Permite la ubicación para recomendaciones más precisas.");
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
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),linear-gradient(135deg,#ffffff,#f8fafc)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.04fr_.96fr] lg:py-16">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              Datos oficiales · ubicación en tiempo real
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Encuentra dónde repostar cerca sin pagar de más.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Compara gasolineras cercanas, guarda tus vehículos y calcula si el ahorro
              compensa el desplazamiento. La app prioriza tu zona para no recomendarte
              una estación lejos solo porque tenga el precio más bajo.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center rounded-[1.55rem] bg-slate-950 px-7 py-5 text-lg font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Buscar gasolineras cerca de mí
              </Link>

              <Link
                href="/mis-vehiculos"
                className="inline-flex items-center justify-center rounded-[1.55rem] border border-slate-200 bg-white px-7 py-5 text-lg font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Añadir mi vehículo
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
              <span className="rounded-full bg-white/90 px-4 py-2 shadow-sm">
                {summary?.totalStations
                  ? `${summary.totalStations.toLocaleString("es-ES")} estaciones`
                  : "Estaciones oficiales"}
              </span>

              <span className="rounded-full bg-white/90 px-4 py-2 shadow-sm">
                Actualizado: {formatDateOnly(summary?.lastUpdate)}
              </span>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700 shadow-sm">
                {locationStatus}
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
            <p className="text-sm font-black text-blue-600">Cómo usarla</p>
            <h2 className="mt-1 text-2xl font-black">Tu decisión de repostaje en 3 pasos</h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/buscar"
                className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-lg font-black">1. Busca por ubicación</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Escribe una calle o usa tu ubicación. Las sugerencias se priorizan cerca de ti.
                </p>
              </Link>

              <Link
                href="/mis-vehiculos"
                className="rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-lg font-black">2. Guarda tu vehículo</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Depósito y consumo sirven para calcular el ahorro real del trayecto.
                </p>
              </Link>

              <Link
                href="/analisis"
                className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="text-lg font-black">3. Analiza si compensa</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  El asistente interpreta tu última búsqueda cercana.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Vista rápida</p>
          <h2 className="mt-1 text-2xl font-black">
            Gasolineras baratas detectadas
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Es solo una muestra general. Para decidir bien, usa tu ubicación y compara
            precio, distancia y vehículo.
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
          <GasMap stations={topStations} userLocation={null} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-blue-600">Idea clave</p>
          <h2 className="mt-1 text-2xl font-black">
            El precio más bajo no siempre es el mayor ahorro.
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            Una gasolinera más barata puede no compensar si está lejos. Por eso la app
            usa ubicación, radio cercano, depósito y consumo para estimar el ahorro real.
          </p>
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
