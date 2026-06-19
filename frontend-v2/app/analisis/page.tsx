"use client";

import Link from "next/link";
import FuelAssistant from "../components/FuelAssistant";
import TopNav from "../components/TopNav";

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black text-blue-600">Análisis</p>
            <h1 className="mt-1 text-4xl font-black">Asistente de repostaje</h1>
            <p className="mt-3 max-w-4xl leading-7 text-slate-600">
              Pregunta de forma libre sobre precios, marcas, distancia, favoritos,
              vehículos o filtros. El asistente usa tu última búsqueda cercana para
              responder con contexto.
            </p>

            <Link
              href="/buscar"
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
            >
              Hacer búsqueda cercana
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-6 shadow-sm">
            <p className="text-sm font-black text-emerald-700">Criterio del asistente</p>
            <h2 className="mt-1 text-2xl font-black">Ubicación primero, precio después</h2>
            <p className="mt-3 leading-7 text-slate-600">
              No tiene sentido recomendar una estación lejana solo porque sea barata.
              El análisis se basa en tu zona y en los filtros que hayas aplicado.
            </p>
          </div>
        </div>

        <FuelAssistant />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Precio local</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Compara dentro de tu zona o dentro de las marcas filtradas.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Distancia real</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ir más lejos puede eliminar el ahorro por el coste del trayecto.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black">Vehículo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Con depósito y consumo guardados el análisis es más útil.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
