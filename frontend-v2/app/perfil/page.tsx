"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

export default function PerfilPage() {
  const [email, setEmail] = useState("");
  const [vehicles, setVehicles] = useState(0);
  const [favorites, setFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setEmail(data.user.email || "");

    const [{ count: vehicleCount }, { count: favoriteCount }] = await Promise.all([
      supabase.from("user_vehicles").select("id", { count: "exact", head: true }),
      supabase.from("user_favorite_stations").select("id", { count: "exact", head: true }),
    ]);

    setVehicles(vehicleCount || 0);
    setFavorites(favoriteCount || 0);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Perfil Rivvo</p>
          <h1 className="mt-2 text-3xl font-black">Tu cuenta</h1>

          {loading ? (
            <p className="mt-4 text-sm font-bold text-slate-500">Cargando perfil...</p>
          ) : (
            <>
              <p className="mt-2 text-sm font-bold text-slate-500">{email}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link href="/mis-vehiculos" className="rounded-3xl bg-emerald-50 p-5 hover:bg-emerald-100">
                  <p className="text-sm font-black uppercase text-emerald-700">Vehículos</p>
                  <p className="mt-2 text-3xl font-black">{vehicles}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-900">Gestiona consumo, combustible y depósito.</p>
                </Link>

                <Link href="/favoritas" className="rounded-3xl bg-blue-50 p-5 hover:bg-blue-100">
                  <p className="text-sm font-black uppercase text-blue-700">Favoritas</p>
                  <p className="mt-2 text-3xl font-black">{favorites}</p>
                  <p className="mt-1 text-sm font-bold text-blue-900">Guarda tus gasolineras de confianza.</p>
                </Link>
              </div>

              <button type="button" onClick={logout} className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800">
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
