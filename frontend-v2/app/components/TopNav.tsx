"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/buscar", label: "Buscar" },
  { href: "/buscar#mapa", label: "Mapa" },
  { href: "/#mas-baratas", label: "Más baratas" },
  { href: "/mis-vehiculos", label: "Mis vehículos" },
  { href: "/favoritas", label: "Favoritas" },
  { href: "/analisis", label: "Análisis" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[3000] border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 text-xl font-black text-white shadow-sm">
            G
          </div>
          <div>
            <p className="text-lg font-black text-slate-950">Gasolineras App</p>
            <p className="text-xs text-slate-500">Ahorro y análisis de repostaje</p>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto pb-1 text-sm font-black lg:pb-0">
          {navItems.map((item) => {
            const cleanHref = item.href.split("#")[0];
            const active = cleanHref !== "/" && pathname === cleanHref;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm"
                    : "whitespace-nowrap rounded-full px-4 py-2 text-slate-700 hover:bg-slate-100"
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
