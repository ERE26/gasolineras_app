"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/buscar", label: "Buscar" },
  { href: "/planificar-viaje", label: "Planifica tu viaje" },
  { href: "/mis-vehiculos", label: "Mis vehículos" },
  { href: "/favoritas", label: "Favoritas" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 text-lg font-black text-white shadow-sm">
            G
          </div>
          <div>
            <p className="text-lg font-black leading-5 text-slate-950">Gasolineras App</p>
            <p className="text-xs font-bold text-slate-500">Ahorro y análisis de repostaje</p>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                    : "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
