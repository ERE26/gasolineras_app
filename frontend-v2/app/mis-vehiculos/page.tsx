"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";

type Vehicle = {
  id: string;
  name: string;
  fuel: string;
  tankLiters: number;
  consumption: number;
};

const fuelOptions = [
  { value: "gasolina95", label: "Gasolina 95" },
  { value: "gasolina98", label: "Gasolina 98" },
  { value: "diesel", label: "Diésel" },
  { value: "diesel_premium", label: "Diésel premium" },
  { value: "glp", label: "GLP" },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [fuel, setFuel] = useState("gasolina95");
  const [tankLiters, setTankLiters] = useState("");
  const [consumption, setConsumption] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("myVehicles");
    if (saved) setVehicles(JSON.parse(saved));
  }, []);

  function saveVehicles(nextVehicles: Vehicle[]) {
    setVehicles(nextVehicles);
    localStorage.setItem("myVehicles", JSON.stringify(nextVehicles));
  }

  function addVehicle() {
    const parsedTank = Number(tankLiters.replace(",", "."));
    const parsedConsumption = Number(consumption.replace(",", "."));

    if (!name.trim()) {
      alert("Pon un nombre al vehículo.");
      return;
    }
    if (!Number.isFinite(parsedTank) || parsedTank <= 0) {
      alert("Indica los litros del depósito.");
      return;
    }
    if (!Number.isFinite(parsedConsumption) || parsedConsumption <= 0) {
      alert("Indica el consumo en L/100 km.");
      return;
    }

    saveVehicles([
      ...vehicles,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        fuel,
        tankLiters: parsedTank,
        consumption: parsedConsumption,
      },
    ]);

    setName("");
    setTankLiters("");
    setConsumption("");
    setFuel("gasolina95");
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-purple-600">Mis vehículos</p>
          <h1 className="mt-1 text-4xl font-black">Guarda tus datos de consumo</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Estos datos se usan para calcular cuánto cuesta llenar el depósito y si
            compensa desplazarte hasta una gasolinera más barata.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black">Nombre del vehículo</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Golf, Ibiza, moto..."
                className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-black">Combustible</p>
              <div className="flex flex-wrap gap-2">
                {fuelOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFuel(option.value)}
                    className={
                      fuel === option.value
                        ? "rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white"
                        : "rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-black">
                  Depósito en litros
                  <span
                    title="Lo usamos para calcular cuánto cuesta llenar el depósito completo en cada gasolinera."
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700"
                  >
                    ?
                  </span>
                </label>
                <input
                  value={tankLiters}
                  onChange={(event) => setTankLiters(event.target.value)}
                  placeholder="Ej: 50"
                  inputMode="decimal"
                  className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Sirve para calcular el coste de llenar el depósito.
                </p>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-black">
                  Consumo L/100 km
                  <span
                    title="Lo usamos para estimar el coste de ida y vuelta si te desvías para repostar."
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700"
                  >
                    ?
                  </span>
                </label>
                <input
                  value={consumption}
                  onChange={(event) => setConsumption(event.target.value)}
                  placeholder="Ej: 6"
                  inputMode="decimal"
                  className="w-full rounded-3xl border border-slate-200 px-5 py-4 text-lg font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Sirve para calcular cuánto te cuesta moverte hasta la estación.
                </p>
              </div>
            </div>

            <button
              onClick={addVehicle}
              className="w-full rounded-3xl bg-purple-600 px-5 py-5 text-xl font-black text-white shadow-lg hover:bg-purple-500"
            >
              Guardar vehículo
            </button>

            <Link
              href="/buscar"
              className="block w-full rounded-3xl bg-slate-950 px-5 py-5 text-center text-xl font-black text-white shadow-lg hover:bg-slate-800"
            >
              Ir al buscador
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Vehículos guardados</h2>

          <div className="mt-5 grid gap-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{vehicle.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {vehicle.fuel} · {vehicle.tankLiters} L · {vehicle.consumption} L/100 km
                    </p>
                    <p className="mt-2 text-sm font-bold text-emerald-700">
                      Autonomía estimada: {((vehicle.tankLiters / vehicle.consumption) * 100).toFixed(0)} km
                    </p>
                  </div>

                  <button
                    onClick={() => saveVehicles(vehicles.filter((item) => item.id !== vehicle.id))}
                    className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            {vehicles.length === 0 && (
              <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                Aún no tienes vehículos guardados.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
