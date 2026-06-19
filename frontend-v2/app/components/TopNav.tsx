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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 text-lg font-black text-white shadow-sm">
              G
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-5 text-slate-950">Gasolineras App</p>
              <p className="hidden text-xs font-bold text-slate-500 sm:block">
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
                    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
                    : "rounded-full px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/buscar"
            className="hidden rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-400 sm:inline-flex"
          >
            Buscar ahora
          </Link>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "rounded-2xl bg-slate-950 px-2 py-2 text-center text-[11px] font-black text-white"
                  : "rounded-2xl px-2 py-2 text-center text-[11px] font-black text-slate-500 hover:bg-slate-100"
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
