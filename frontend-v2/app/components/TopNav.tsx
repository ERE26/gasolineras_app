"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/buscar", label: "Buscar gasolineras" },
  { href: "/planificar-viaje", label: "Planifica tu viaje" },
  { href: "/mis-vehiculos", label: "Mis vehículos" },
  { href: "/favoritas", label: "Favoritas" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActivePath(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-[120] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" onClick={closeMenu} className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0B132B] shadow-sm ring-1 ring-slate-200">
            <img
              src="/rivvo_app_icon.png"
              alt="Rivvo"
              className="h-full w-full object-cover"
            />
          </span>

          <span className="min-w-0">
            <span className="block text-xl font-black leading-5 tracking-tight text-[#0B132B]">
              Rivvo
            </span>
            <span className="hidden text-xs font-bold text-slate-500 sm:block">
              Ahorra en cada repostaje
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => {
            const active = isActivePath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "whitespace-nowrap rounded-2xl bg-[#14B8A6]/15 px-4 py-2 text-sm font-black text-[#0B132B] ring-1 ring-[#14B8A6]/30 shadow-sm"
                    : "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-full bg-[#0B132B] px-5 py-2.5 text-sm font-black text-white shadow-sm hover:opacity-90"
          >
            Entrar
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/login"
            onClick={closeMenu}
            className="rounded-full bg-[#0B132B] px-4 py-2 text-sm font-black text-white shadow-sm"
          >
            Entrar
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0B132B] shadow-sm"
          >
            <span className="sr-only">{mobileOpen ? "Cerrar menú" : "Abrir menú"}</span>
            <span className="flex flex-col gap-1.5">
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  mobileOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  mobileOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-current transition ${
                  mobileOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <div className="border-t border-slate-200 bg-white px-4 pb-4 shadow-xl">
            <div className="mx-auto grid max-w-7xl gap-2 pt-3">
              {navItems.map((item) => {
                const active = isActivePath(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={
                      active
                        ? "flex items-center justify-between rounded-2xl bg-[#14B8A6]/15 px-4 py-3 text-base font-black text-[#0B132B] ring-1 ring-[#14B8A6]/30"
                        : "flex items-center justify-between rounded-2xl px-4 py-3 text-base font-black text-slate-700 hover:bg-slate-100"
                    }
                  >
                    <span>{item.label}</span>
                    <span className="text-lg text-slate-400">›</span>
                  </Link>
                );
              })}

              <Link
                href="/onboarding"
                onClick={closeMenu}
                className="mt-2 rounded-2xl bg-[#0B132B] px-4 py-3 text-center text-base font-black text-white shadow-sm"
              >
                Primeros pasos
              </Link>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-bold text-slate-500">
                <Link href="/privacidad" onClick={closeMenu} className="rounded-xl bg-slate-50 px-2 py-2">
                  Privacidad
                </Link>
                <Link href="/aviso-legal" onClick={closeMenu} className="rounded-xl bg-slate-50 px-2 py-2">
                  Aviso legal
                </Link>
                <Link href="/contacto" onClick={closeMenu} className="rounded-xl bg-slate-50 px-2 py-2">
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
