"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Inicio", shortLabel: "Inicio", icon: "🏠" },
  { href: "/buscar", label: "Buscar", shortLabel: "Buscar", icon: "⛽" },
  { href: "/planificar-viaje", label: "Planifica tu viaje", shortLabel: "Viaje", icon: "🗺️" },
  { href: "/favoritas", label: "Favoritas", shortLabel: "Guardadas", icon: "⭐" },
  { href: "/mis-vehiculos", label: "Mis vehículos", shortLabel: "Coche", icon: "🚗" },
];

export default function TopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#07111f]/95 text-white shadow-[0_10px_30px_rgba(7,17,31,0.16)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-500 to-blue-500 text-lg font-black text-white shadow-sm">
              G
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-5 text-white">Gasolineras App</p>
              <p className="hidden text-xs font-bold text-slate-300 sm:block">
                Reposta mejor cerca de ti o en ruta
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 shadow-sm"
                    : "rounded-full px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/buscar"
            className="hidden rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 shadow-sm hover:bg-emerald-300 sm:inline-flex"
          >
            Buscar ahora
          </Link>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#07111f]/96 px-2 py-2 shadow-[0_-10px_30px_rgba(7,17,31,0.20)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "rounded-2xl bg-emerald-400 px-2 py-2 text-center text-[11px] font-black text-slate-950"
                  : "rounded-2xl px-2 py-2 text-center text-[11px] font-black text-slate-300 hover:bg-white/10"
              }
            >
              <span className="block text-base leading-5">{item.icon}</span>
              <span>{item.shortLabel}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
