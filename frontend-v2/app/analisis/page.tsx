"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FuelAssistant from "../components/FuelAssistant";
import TopNav from "../components/TopNav";

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
};

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

type CheapestSummary = {
  fuel: string;
  peninsulaBaleares: Station[];
  canarias: Station[];
};

type Summary = {
  totalStations: number;
  totalPrices: number;
  lastUpdate: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function best(stations: Station[]) {
  return stations.length > 0 ? stations[0] : null;
}

export default function AnalysisPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cheapest, setCheapest] = useState<CheapestSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryResponse, cheapestResponse] = await Promise.all([
          fetch(`${API_URL}/api/summary`),
          fetch(`${API_URL}/api/cheapest-summary?fuel=gasolina95&limit=6`),
        ]);
        setSummary(await summaryResponse.json());
        setCheapest(await cheapestResponse.json());
      } catch (error) {
        console.error("Error cargando análisis:", error);
      }
    }

    load();

    const savedVehicles = localStorage.getItem("myVehicles");
    if (savedVehicles) {
      const parsed: Vehicle[] = JSON.parse(savedVehicles);
      setVehicles(parsed);
      if (parsed.length > 0) setSelectedVehicleId(parsed[0].id);
    }
  }, []);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const analysisStations = useMemo(() => {
    if (!cheapest) return [];
    return [...cheapest.peninsulaBaleares, ...cheapest.canarias].sort((a, b) => Number(a.price) - Number(b.price));
  }, [cheapest]);

  const bestPeninsula = best(cheapest?.peninsulaBaleares || []);
  const bestCanarias = best(cheapest?.canarias || []);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-black text-blue-600">Asistente y explicación</p>
          <h1 className="mt-1 text-4xl font-black">Analizador de ahorro</h1>
          <p className="mx-auto mt-3 max-w-3xl text-slate-600">
            Este apartado sirve para entender los precios, comparar zonas y decidir si merece la pena desplazarse a una gasolinera más barata.
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Estaciones analizadas</p>
            <p className="mt-1 text-3xl font-black">{summary?.totalStations?.toLocaleString("es-ES") ?? "-"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Precios registrados</p>
            <p className="mt-1 text-3xl font-black">{summary?.totalPrices?.toLocaleString("es-ES") ?? "-"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Vehículo usado</p>
            <p className="mt-1 text-lg font-black">{selectedVehicle?.name || "Depósito estándar"}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Elegir vehículo para el análisis</h2>
              <p className="mt-1 text-sm text-slate-500">Se usa para estimar depósito, consumo y ahorro neto.</p>
              {vehicles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {vehicles.map((vehicle) => (
                    <button key={vehicle.id} onClick={() => setSelectedVehicleId(vehicle.id)} className={selectedVehicleId === vehicle.id ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"}>
                      {vehicle.name}
                    </button>
                  ))}
                </div>
              ) : (
                <Link href="/mis-vehiculos" className="mt-4 block rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-100">
                  Añadir vehículo →
                </Link>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Lectura rápida</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p><strong>1.</strong> Si la diferencia es de pocos céntimos, manda más la cercanía.</p>
                <p><strong>2.</strong> Si llenas muchos litros, una diferencia pequeña por litro puede ahorrar bastante.</p>
                <p><strong>3.</strong> Canarias se compara aparte porque su fiscalidad hace que los precios no sean directamente comparables.</p>
                <p><strong>4.</strong> Con un vehículo guardado, el cálculo es más realista que usar un depósito estándar.</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Mejores precios actuales</h2>
              <div className="mt-4 grid gap-3">
                {bestPeninsula && (
                  <div className="rounded-3xl bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-700">Península y Baleares</p>
                    <p className="font-black">{bestPeninsula.name}</p>
                    <p className="text-sm text-slate-500">{bestPeninsula.municipality}, {bestPeninsula.province}</p>
                    <p className="mt-1 text-xl font-black text-emerald-700">{Number(bestPeninsula.price).toFixed(3)} €/L</p>
                  </div>
                )}
                {bestCanarias && (
                  <div className="rounded-3xl bg-blue-50 p-4">
                    <p className="text-sm font-black text-blue-700">Canarias</p>
                    <p className="font-black">{bestCanarias.name}</p>
                    <p className="text-sm text-slate-500">{bestCanarias.municipality}, {bestCanarias.province}</p>
                    <p className="mt-1 text-xl font-black text-blue-700">{Number(bestCanarias.price).toFixed(3)} €/L</p>
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            <FuelAssistant stations={analysisStations} selectedVehicle={selectedVehicle} fuel="gasolina95" brand="" province="" municipality="" />

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Qué debería mirar el usuario</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <h3 className="font-black">Ahorro bruto</h3>
                  <p className="mt-2 text-sm text-slate-600">Diferencia entre el precio de la gasolinera y la media multiplicada por los litros del depósito.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <h3 className="font-black">Coste del desvío</h3>
                  <p className="mt-2 text-sm text-slate-600">Si tienes que recorrer kilómetros extra, ese combustible también cuesta dinero.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <h3 className="font-black">Zona comparable</h3>
                  <p className="mt-2 text-sm text-slate-600">No compares Canarias con Península como si fueran el mismo mercado fiscal.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <h3 className="font-black">Marca y confianza</h3>
                  <p className="mt-2 text-sm text-slate-600">El precio es importante, pero también puede influir la ubicación, horario y preferencia de marca.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
