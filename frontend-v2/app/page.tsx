"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
};

type CheapestSummary = {
  fuel: string;
  peninsulaBaleares: Station[];
  canarias: Station[];
};

const GasMap = dynamic(() => import("./components/GasMap"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDate(value: string | null | undefined) {
  if (!value) return "datos automáticos";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MiniStation({ station, index }: { station: Station; index: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-emerald-600">#{index + 1} más barata</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{station.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {station.municipality}, {station.province}
          </p>
          <p className="mt-1 text-xs text-slate-400">{station.brand || "Marca no indicada"}</p>
        </div>
        <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-right text-white">
          <p className="text-lg font-black">{Number(station.price).toFixed(3)} €</p>
          <p className="text-[10px] font-bold opacity-90">/ litro</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapest, setCheapest] = useState<CheapestSummary | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryResponse, cheapestResponse] = await Promise.all([
          fetch(`${API_URL}/api/summary`),
          fetch(`${API_URL}/api/cheapest-summary?fuel=gasolina95&limit=4`),
        ]);

        setSummary(await summaryResponse.json());
        setCheapest(await cheapestResponse.json());
      } catch (error) {
        console.error("Error cargando datos de la home:", error);
      }
    }

    loadData();
  }, []);

  const mapStations = useMemo(() => {
    if (!cheapest) return [];
    return [...cheapest.peninsulaBaleares.slice(0, 3), ...cheapest.canarias.slice(0, 3)];
  }, [cheapest]);

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
              <p className="text-xs text-slate-500">Precios oficiales en España</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link href="/buscar" className="rounded-full bg-slate-950 px-4 py-2 text-white hover:bg-slate-800">
              Buscar
            </Link>
            <a href="#mas-baratas" className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100">
              Más baratas
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_34%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_38%),linear-gradient(135deg,#ffffff,#f8fafc)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
              Datos oficiales · actualización automática
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Reposta mejor. Ahorra antes de arrancar.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Encuentra gasolineras baratas por ubicación, provincia, marca o combustible.
              Compara precios, calcula el ahorro de tu depósito y decide si te compensa ir.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-slate-600">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                {summary?.totalStations?.toLocaleString("es-ES") ?? "-"} estaciones registradas
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                {summary?.totalPrices?.toLocaleString("es-ES") ?? "-"} precios analizados
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Actualizado: {formatDate(summary?.lastUpdate)}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white shadow-xl hover:bg-slate-800"
              >
                Buscar gasolineras
              </Link>
              <Link
                href="/buscar?quick=nearby95"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center font-black text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Gasolina 95 cerca de mí
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="h-[360px] overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl">
              {mapStations.length > 0 ? (
                <GasMap stations={mapStations} userLocation={null} />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  Cargando mapa de precios...
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-black text-blue-700">Vista rápida</p>
              <p className="mt-1 text-sm text-slate-600">
                El mapa muestra una selección de gasolineras baratas. Para comparar por zona,
                combustible o marca, entra en el buscador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="mas-baratas" className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black text-emerald-600">Gasolina 95</p>
            <h2 className="text-3xl font-black">Más baratas ahora</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Separamos Canarias porque sus precios suelen ser más bajos por su fiscalidad específica,
              así la comparación es más justa.
            </p>
          </div>
          <Link href="/buscar" className="rounded-2xl bg-emerald-500 px-5 py-3 text-center font-black text-white hover:bg-emerald-400">
            Ver ranking completo
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-black">Península y Baleares</h3>
            <div className="grid gap-3">
              {cheapest?.peninsulaBaleares?.map((station, index) => (
                <MiniStation key={station.id} station={station} index={index} />
              ))}
              {!cheapest?.peninsulaBaleares?.length && <p className="text-slate-500">Cargando datos...</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-black">Canarias</h3>
            <div className="grid gap-3">
              {cheapest?.canarias?.map((station, index) => (
                <MiniStation key={station.id} station={station} index={index} />
              ))}
              {!cheapest?.canarias?.length && <p className="text-slate-500">Cargando datos...</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-3xl">📍</p>
            <h2 className="mt-4 text-xl font-black">Busca por zona</h2>
            <p className="mt-2 text-slate-600">
              Usa tu ubicación o escribe una dirección para ver gasolineras cercanas.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-3xl">🚗</p>
            <h2 className="mt-4 text-xl font-black">Calcula tu ahorro</h2>
            <p className="mt-2 text-slate-600">
              Añade tu vehículo y estima coste de depósito, autonomía y desvío.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-3xl">🤖</p>
            <h2 className="mt-4 text-xl font-black">Asistente de análisis</h2>
            <p className="mt-2 text-slate-600">
              Pregunta qué estación conviene, cómo comparar zonas o por qué cambia el precio.
            </p>
          </div>
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
