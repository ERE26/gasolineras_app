"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapStations, setCheapStations] = useState<Station[]>([]);

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

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),linear-gradient(135deg,#ffffff,#f8fafc)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              Datos oficiales del Geoportal · actualización automática
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Ahorra al repostar sin dar vueltas.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              La web localiza gasolineras cerca de ti, compara precios reales y calcula
              si merece la pena desplazarte según tu vehículo. No te manda a otra ciudad:
              prioriza tu zona y ajusta el radio según estés en centro urbano o en afueras.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center rounded-[1.7rem] bg-slate-950 px-8 py-6 text-xl font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Buscar gasolineras cerca de mí
              </Link>

              <Link
                href="/analisis"
                className="inline-flex items-center justify-center rounded-[1.7rem] border border-slate-200 bg-white px-8 py-6 text-xl font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Analizar ahorro
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">
                {summary?.totalStations ? `${summary.totalStations.toLocaleString("es-ES")} estaciones` : "Estaciones oficiales"}
              </span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">
                {summary?.totalPrices ? `${summary.totalPrices.toLocaleString("es-ES")} precios analizados` : "Precios actualizados"}
              </span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">
                {summary?.lastUpdate
                  ? `Actualizado: ${new Date(summary.lastUpdate).toLocaleString("es-ES")}`
                  : "Actualización automática"}
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl">
            <p className="text-sm font-black text-blue-600">Cómo funciona</p>
            <h2 className="mt-1 text-2xl font-black">Tres pasos muy simples</h2>

            <div className="mt-5 grid gap-4">
              <Link
                href="/buscar"
                className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">📍</p>
                <h3 className="mt-3 text-xl font-black">1. Busca por ubicación</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Puedes usar tu ubicación o escribir una dirección. En ciudad densa
                  busca cerca; en afueras amplía el radio automáticamente.
                </p>
              </Link>

              <Link
                href="/mis-vehiculos"
                className="rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">🚗</p>
                <h3 className="mt-3 text-xl font-black">2. Añade tu vehículo</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Guarda depósito y consumo para calcular coste real de repostar y moverte.
                </p>
              </Link>

              <Link
                href="/analisis"
                className="rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <p className="text-3xl">🧠</p>
                <h3 className="mt-3 text-xl font-black">3. Decide con análisis</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  El asistente compara solo opciones razonables para tu zona.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Vista rápida</p>
          <h2 className="mt-1 text-3xl font-black">
            Algunas gasolineras baratas detectadas
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Esta lista es una muestra general. Para decidir dónde repostar, usa tu ubicación:
            el precio más barato lejos de ti no siempre es el mayor ahorro.
          </p>

          <div className="mt-6 grid gap-3">
            {cheapStations.slice(0, 5).map((station, index) => (
              <div
                key={station.id}
                className="flex items-center justify-between gap-4 rounded-3xl bg-slate-50 p-4"
              >
                <div>
                  <p className="text-sm font-black text-slate-500">
                    #{index + 1} · {station.municipality}, {station.province}
                  </p>
                  <p className="font-black">{station.name}</p>
                  <p className="text-sm text-slate-500">
                    {station.brand || "Marca no indicada"}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500 px-4 py-3 text-right text-white">
                  <p className="text-xl font-black">
                    {Number(station.price).toFixed(3)} €
                  </p>
                  <p className="text-xs font-bold">por litro</p>
                </div>
              </div>
            ))}

            {cheapStations.length === 0 && (
              <p className="rounded-3xl bg-slate-50 p-5 text-slate-500">
                Cargando gasolineras...
              </p>
            )}
          </div>
        </div>

        <div className="h-[520px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <GasMap stations={cheapStations} userLocation={null} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-blue-600">Idea clave</p>
          <h2 className="mt-1 text-3xl font-black">
            El mejor precio no siempre es la mejor decisión.
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            Para ahorrar de verdad hay que comparar el precio con tu radio cercano,
            el consumo de tu coche y el coste de desviarte. Por eso la web separa
            búsqueda, vehículos y análisis.
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
