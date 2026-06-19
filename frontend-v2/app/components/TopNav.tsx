"use client";

import Image from "next/image";
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
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/rivvo-app-icon.png"
            alt="Rivvo"
            width={56}
            height={56}
            className="h-11 w-11 rounded-2xl shadow-sm sm:hidden"
            priority
          />
          <div className="hidden sm:block">
            <Image
              src="/brand/rivvo-logo.png"
              alt="Rivvo"
              width={260}
              height={80}
              className="h-11 w-auto"
              priority
            />
          </div>
          <div className="sm:hidden">
            <p className="text-lg font-black leading-5 text-[var(--rivvo-navy)]">Rivvo</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--rivvo-teal)]">
              Move smart. Save fuel.
            </p>
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
                    ? "whitespace-nowrap rounded-2xl bg-[var(--rivvo-navy)] px-4 py-2 text-sm font-black text-white shadow-sm"
                    : "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-[rgba(20,184,166,0.10)] hover:text-[var(--rivvo-navy)]"
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
