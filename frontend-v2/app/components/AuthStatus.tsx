"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || null));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (email) {
    return (
      <Link href="/perfil" className="whitespace-nowrap rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-400">
        Mi perfil
      </Link>
    );
  }

  return (
    <Link href="/login" className="whitespace-nowrap rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
      Entrar
    </Link>
  );
}
