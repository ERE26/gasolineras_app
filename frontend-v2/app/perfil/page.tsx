"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function clearPrivateLocalCache() {
  if (typeof window === "undefined") return;

  const privateKeys = [
    "myVehicles",
    "favoriteStationsFull",
    "favoriteStationIds",
    "favoriteStations",
    "favoriteStationIdsFull",
    "selectedVehicleId",
    "selectedFavoriteId",
  ];

  privateKeys.forEach((key) => window.localStorage.removeItem(key));
}

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [lastSignInAt, setLastSignInAt] = useState("");
  const [vehicles, setVehicles] = useState(0);
  const [favorites, setFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const createdAtLabel = useMemo(() => {
    if (!createdAt) return "No disponible";

    try {
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(createdAt));
    } catch {
      return "No disponible";
    }
  }, [createdAt]);

  const lastSignInLabel = useMemo(() => {
    if (!lastSignInAt) return "No disponible";

    try {
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(lastSignInAt));
    } catch {
      return "No disponible";
    }
  }, [lastSignInAt]);

  async function loadProfile() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setEmail(data.user.email || "");
    setEmail(data.user.email || "");

    await supabase.from("user_profiles").upsert({
      id: data.user.id,
      email: data.user.email,
    });
    setCreatedAt(data.user.created_at || "");
    setLastSignInAt(data.user.last_sign_in_at || "");

    const [{ count: vehicleCount }, { count: favoriteCount }] = await Promise.all([
      supabase.from("user_vehicles").select("id", { count: "exact", head: true }),
      supabase.from("user_favorite_stations").select("id", { count: "exact", head: true }),
    ]);

    setVehicles(vehicleCount || 0);
    setFavorites(favoriteCount || 0);
    setLoading(false);
  }

  async function logout() {
    clearPrivateLocalCache();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#0B132B] via-[#0f1b3d] to-[#14B8A6] p-6 text-white sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">Mi cuenta</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Panel personal de Rivvo</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-white/80">
              Gestiona tus vehículos, tus estaciones favoritas y los datos básicos de tu cuenta.
            </p>
          </div>

          {loading ? (
            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold text-slate-500">Cargando cuenta...</p>
            </div>
          ) : (
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_.9fr]">
              <section className="space-y-4">
                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Resumen</p>
                  <h2 className="mt-1 text-2xl font-black">Tu actividad</h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Link href="/mis-vehiculos" className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100 hover:bg-emerald-100">
                      <p className="text-sm font-black uppercase text-emerald-700">Vehículos</p>
                      <p className="mt-2 text-4xl font-black">{vehicles}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-900">Consumo, combustible y depósito.</p>
                    </Link>

                    <Link href="/favoritas" className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100 hover:bg-blue-100">
                      <p className="text-sm font-black uppercase text-blue-700">Favoritas</p>
                      <p className="mt-2 text-4xl font-black">{favorites}</p>
                      <p className="mt-1 text-sm font-bold text-blue-900">Tus estaciones guardadas.</p>
                    </Link>
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Accesos rápidos</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Link href="/buscar" className="rounded-2xl border border-slate-200 px-4 py-4 font-black text-slate-800 hover:bg-slate-50">
                      Buscar gasolineras
                    </Link>
                    <Link href="/planificar-viaje" className="rounded-2xl border border-slate-200 px-4 py-4 font-black text-slate-800 hover:bg-slate-50">
                      Planificar viaje
                    </Link>
                    <Link href="/mis-vehiculos" className="rounded-2xl border border-slate-200 px-4 py-4 font-black text-slate-800 hover:bg-slate-50">
                      Gestionar vehículos
                    </Link>
                    <Link href="/favoritas" className="rounded-2xl border border-slate-200 px-4 py-4 font-black text-slate-800 hover:bg-slate-50">
                      Gestionar favoritas
                    </Link>
                  </div>
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Mis datos</p>
                  <h2 className="mt-1 text-2xl font-black">Datos de la cuenta</h2>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Email</p>
                      <p className="mt-1 break-all text-sm font-black text-slate-900">{email}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Cuenta creada</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{createdAtLabel}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Último acceso</p>
                      <p className="mt-1 text-sm font-black text-slate-900">{lastSignInLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Seguridad</p>
                  <h2 className="mt-1 text-xl font-black">Sesión iniciada</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Al cerrar sesión se limpian de este dispositivo los datos privados guardados localmente.
                  </p>

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
