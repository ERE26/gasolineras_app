"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

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

function fuelLabel(value: string) {
  return fuelOptions.find((item) => item.value === value)?.label || value;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [name, setName] = useState("");
  const [fuel, setFuel] = useState("gasolina95");
  const [tankLiters, setTankLiters] = useState("");
  const [consumption, setConsumption] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    setSyncing(true);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setUserId(null);

      const saved = localStorage.getItem("myVehicles");
      if (saved) {
        try {
          setVehicles(JSON.parse(saved));
        } catch {
          setVehicles([]);
        }
      }

      setSyncing(false);
      return;
    }

    setUserId(user.id);

    const { data: rows, error } = await supabase
      .from("user_vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setSyncing(false);
      return;
    }

    setVehicles(
      (rows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        fuel: row.fuel,
        tankLiters: Number(row.tank_liters || 0),
        consumption: Number(row.consumption || 0),
      }))
    );

    setSyncing(false);
  }

  async function saveVehicles(nextVehicles: Vehicle[]) {
    setVehicles(nextVehicles);

    if (!userId) {
      localStorage.setItem("myVehicles", JSON.stringify(nextVehicles));
      return;
    }

    setSyncing(true);

    const currentIds = vehicles.map((vehicle) => vehicle.id);
    const nextIds = nextVehicles.map((vehicle) => vehicle.id);
    const removedIds = currentIds.filter((id) => !nextIds.includes(id));

    if (removedIds.length > 0) {
      await supabase.from("user_vehicles").delete().in("id", removedIds);
    }

    for (const vehicle of nextVehicles) {
      await supabase.from("user_vehicles").upsert({
        id: vehicle.id,
        user_id: userId,
        name: vehicle.name,
        fuel: vehicle.fuel,
        tank_liters: vehicle.tankLiters,
        consumption: vehicle.consumption,
      });
    }

    setSyncing(false);
  }

  async function addVehicle() {
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

    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      name: name.trim(),
      fuel,
      tankLiters: parsedTank,
      consumption: parsedConsumption,
    };

    await saveVehicles([...vehicles, vehicle]);
    setName("");
    setTankLiters("");
    setConsumption("");
    setFuel("gasolina95");
  }

  async function removeVehicle(id: string) {
    await saveVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-7">
        <div className="mb-6">
          <p className="text-sm font-black text-purple-600">Mis vehículos</p>
          <h1 className="text-4xl font-black">Vehículos y consumo</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Guarda depósito y consumo para calcular el coste real de repostar y desplazarte.
          </p>

          {!userId && !syncing && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              Estás sin iniciar sesión. Puedes probarlo, pero para guardar tus vehículos en tu perfil entra con tu cuenta.
            </p>
          )}

          {userId && (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Vehículos sincronizados con tu perfil.
            </p>
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_.82fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Vehículos guardados</h2>
                <p className="text-sm text-slate-500">
                  {userId ? "Se guardan en tu perfil y aparecen en el buscador." : "Se guardan en tu navegador hasta que entres en tu cuenta."}
                </p>
              </div>

              <Link
                href="/buscar"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
              >
                Ir al buscador
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {vehicles.map((vehicle) => (
                <article key={vehicle.id} className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{vehicle.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {fuelLabel(vehicle.fuel)} · {vehicle.tankLiters} L ·{" "}
                        {vehicle.consumption} L/100 km
                      </p>
                      <p className="mt-2 text-sm font-bold text-emerald-700">
                        Autonomía estimada:{" "}
                        {((vehicle.tankLiters / vehicle.consumption) * 100).toFixed(0)} km
                      </p>
                    </div>

                    <button
                      onClick={() => removeVehicle(vehicle.id)}
                      className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}

              {vehicles.length === 0 && (
                <p className="rounded-3xl bg-slate-50 p-6 text-slate-500">
                  Aún no tienes vehículos guardados. Añade uno desde el formulario de la derecha.
                </p>
              )}
            </div>
          </section>

          <aside className="self-start rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-purple-600">Añadir vehículo</p>
            <h2 className="mt-1 text-2xl font-black">Datos básicos</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black">Nombre</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej: Golf, Ibiza, moto..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
                          ? "rounded-full bg-purple-600 px-3 py-2 text-xs font-black text-white"
                          : "rounded-full bg-purple-50 px-3 py-2 text-xs font-black text-purple-700 hover:bg-purple-100"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black">
                    Depósito
                    <span
                      title="Lo usamos para calcular cuánto cuesta llenar el depósito completo."
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
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-black">
                    Consumo
                    <span
                      title="Lo usamos para estimar cuánto cuesta ir y volver de una gasolinera."
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
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-purple-50 p-4 text-sm text-purple-900">
                El depósito sirve para calcular cuánto pagas al llenar. El consumo sirve
                para estimar si compensa desviarte.
              </div>

              <button
                onClick={addVehicle}
                className="w-full rounded-2xl bg-purple-600 px-5 py-4 text-lg font-black text-white shadow-lg hover:bg-purple-500"
              >
                Guardar vehículo
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
