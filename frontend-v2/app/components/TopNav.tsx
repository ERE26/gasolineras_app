"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/buscar", label: "Buscar" },
  { href: "/mis-vehiculos", label: "Mis vehículos" },
  { href: "/favoritas", label: "Favoritas" },
  { href: "/analisis", label: "Análisis" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[3000] border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 text-lg font-black text-white shadow-sm">
            G
          </div>
          <div className="leading-tight">
            <p className="font-black text-slate-950">Gasolineras App</p>
            <p className="text-xs font-semibold text-slate-500">Ahorro y análisis de repostaje</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
                    : "rounded-full px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/buscar"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-400 md:hidden"
        >
          Buscar
        </Link>
      </div>
    </header>
  );
}
