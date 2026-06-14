"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = { totalStations: number; totalPrices: number; lastUpdate: string | null };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch(`${API_URL}/api/summary`);
        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error("Error cargando resumen:", error);
      }
    }
    loadSummary();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 text-xl font-black text-white">G</div>
            <div><p className="text-lg font-black">Gasolineras App</p><p className="text-xs text-slate-500">Precios oficiales en España</p></div>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link href="/buscar" className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100">Buscar</Link>
            <a href="#como-funciona" className="rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100">Cómo funciona</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#bbf7d0,transparent_35%),radial-gradient(circle_at_top_right,#bfdbfe,transparent_40%),linear-gradient(135deg,#ffffff,#f8fafc)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Datos oficiales del Geoportal de Hidrocarburos</div>
            <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">Encuentra dónde repostar más barato sin perder tiempo.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Busca por dirección, provincia, municipio, combustible o marca. Calcula cuánto cuesta llenar tu depósito y si te compensa desviarte hasta una gasolinera.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/buscar" className="rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white shadow-xl hover:bg-slate-800">Buscar gasolineras</Link>
              <a href="#como-funciona" className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center font-black text-slate-900 shadow-sm hover:bg-slate-50">Ver funciones</a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white bg-white/75 p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-emerald-300">Resumen actual</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-slate-300">Estaciones registradas</p><p className="text-4xl font-black">{summary?.totalStations ?? "-"}</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-slate-300">Precios guardados</p><p className="text-4xl font-black">{summary?.totalPrices ?? "-"}</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-slate-300">Última actualización</p><p className="font-bold">{summary?.lastUpdate ? new Date(summary.lastUpdate).toLocaleString("es-ES") : "Pendiente"}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-3xl">📍</p><h2 className="mt-4 text-xl font-black">Busca por zona</h2><p className="mt-2 text-slate-600">Usa tu ubicación o escribe una dirección para ver gasolineras cercanas.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-3xl">🚗</p><h2 className="mt-4 text-xl font-black">Añade tus vehículos</h2><p className="mt-2 text-slate-600">Calcula coste de llenar depósito, autonomía estimada y ahorro.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-3xl">⭐</p><h2 className="mt-4 text-xl font-black">Guarda favoritas</h2><p className="mt-2 text-slate-600">Marca tus gasolineras habituales y compara precios de forma rápida.</p></div>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-sm text-slate-500"><div className="mx-auto max-w-7xl">Datos obtenidos del Geoportal de Hidrocarburos / MITECO. Esta web no pertenece ni está afiliada al Gobierno de España. Los precios pueden variar y deben verificarse en la estación de servicio.</div></footer>
    </main>
  );
}
