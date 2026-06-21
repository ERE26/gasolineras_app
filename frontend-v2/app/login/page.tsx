"use client";

import Link from "next/link";
import { useState } from "react";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage("");

    if (!email.trim() || password.length < 6) {
      setMessage("Pon un email y una contraseña de al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
         email: email.trim(),
         password,
         options: {
          emailRedirectTo: `${window.location.origin}/perfil`,
         },
        });
        if (error) throw error;

        setMessage("Cuenta creada. Revisa tu email si Supabase te pide confirmar la cuenta.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      window.location.href = "/perfil";
    } catch (error: any) {
      setMessage(error?.message || "No se ha podido iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopNav />

      <section className="mx-auto flex max-w-3xl flex-1 px-4 py-10">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-emerald-600">Tu cuenta Rivvo</p>
          <h1 className="mt-2 text-3xl font-black">{mode === "login" ? "Entrar" : "Crear cuenta"}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Regístrate para guardar tus vehículos y tus gasolineras favoritas en tu perfil.
          </p>

          <div className="mt-6 grid gap-3">
            <label className="text-sm font-black">Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />

            <label className="mt-2 text-sm font-black">Contraseña</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" className="rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" />

            {message && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{message}</p>}

            <button type="button" onClick={submit} disabled={loading} className="mt-3 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white hover:bg-slate-800 disabled:opacity-60">
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2 text-sm font-bold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="text-left text-emerald-700 hover:text-emerald-600">
              {mode === "login" ? "No tengo cuenta, registrarme" : "Ya tengo cuenta, entrar"}
            </button>

            <Link href="/" className="text-slate-500 hover:text-slate-800">Volver a Rivvo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
