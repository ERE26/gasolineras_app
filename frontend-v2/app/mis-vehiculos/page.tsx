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
  { value: "gnc", label: "GNC" },
  { value: "gnl", label: "GNL" },
  { value: "hidrogeno", label: "Hidrógeno" },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [fuel, setFuel] = useState("gasolina95");
  const [tankLiters, setTankLiters] = useState(50);
  const [consumption, setConsumption] = useState(6);

  useEffect(() => {
    const saved = localStorage.getItem("myVehicles");
    if (saved) setVehicles(JSON.parse(saved));
  }, []);

  function save(next: Vehicle[]) {
    setVehicles(next);
    localStorage.setItem("myVehicles", JSON.stringify(next));
  }

  function addVehicle() {
    if (!name.trim()) {
      alert("Ponle un nombre al vehículo.");
      return;
    }

    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: name.trim(),
      fuel,
      tankLiters,
      consumption,
    };

    save([...vehicles, vehicle]);
    setName("");
    setFuel("gasolina95");
    setTankLiters(50);
    setConsumption(6);
  }

  function deleteVehicle(id: string) {
    save(vehicles.filter((vehicle) => vehicle.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-black text-purple-600">Cálculos personalizados</p>
          <h1 className="mt-1 text-4xl font-black">Mis vehículos</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Guarda tus coches o motos para que el buscador calcule depósito, autonomía y ahorro real con tus datos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Vehículos guardados</h2>
            <div className="mt-5 grid gap-4">
              {vehicles.map((vehicle) => {
                const range = (vehicle.tankLiters / vehicle.consumption) * 100;
                return (
                  <div key={vehicle.id} className="rounded-3xl bg-purple-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{vehicle.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{vehicle.fuel}</p>
                        <p className="mt-2 text-sm text-slate-700">
                          Depósito: <strong>{vehicle.tankLiters} L</strong> · Consumo: <strong>{vehicle.consumption} L/100 km</strong>
                        </p>
                        <p className="mt-1 text-sm font-black text-blue-700">Autonomía estimada: {range.toFixed(0)} km</p>
                      </div>
                      <button onClick={() => deleteVehicle(vehicle.id)} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50">
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}

              {vehicles.length === 0 && (
                <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                  Todavía no tienes vehículos guardados.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Añadir vehículo</h2>
            <div className="mt-5 space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre: Golf, Ibiza, Moto..." className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />

              <div>
                <p className="mb-2 text-sm font-black text-slate-800">Combustible</p>
                <div className="flex flex-wrap gap-2">
                  {fuelOptions.map((option) => (
                    <button key={option.value} onClick={() => setFuel(option.value)} className={fuel === option.value ? "rounded-full bg-purple-600 px-4 py-2 text-sm font-black text-white" : "rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700 hover:bg-purple-100"}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-black text-slate-800">
                  Depósito en litros
                  <input type="number" value={tankLiters} onChange={(e) => setTankLiters(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="text-sm font-black text-slate-800">
                  Consumo L/100 km
                  <input type="number" step="0.1" value={consumption} onChange={(e) => setConsumption(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>

              <button onClick={addVehicle} className="w-full rounded-2xl bg-purple-600 px-4 py-3 font-black text-white hover:bg-purple-500">
                Guardar vehículo
              </button>

              <Link href="/buscar" className="block rounded-2xl bg-slate-950 px-4 py-3 text-center font-black text-white hover:bg-slate-800">
                Ir al buscador
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
