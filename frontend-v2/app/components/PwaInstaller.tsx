"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function PwaInstaller() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const dismissed = localStorage.getItem("rivvoInstallDismissed") === "true";

    if (!dismissed && !isStandaloneMode()) {
      setIos(isIOS());
      const timer = window.setTimeout(() => setVisible(true), 1600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      if (!isStandaloneMode()) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("rivvoInstallDismissed", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-xl rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
          📱
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">Instala Rivvo en tu móvil</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            Accede como una app, guarda vehículos y consulta gasolineras más rápido.
          </p>

          {ios ? (
            <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              En iPhone: Safari → Compartir → Añadir a pantalla de inicio.
            </p>
          ) : (
            <button
              type="button"
              onClick={installApp}
              disabled={!installPrompt}
              className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            >
              Instalar Rivvo
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="rounded-full px-2 text-xl font-black text-slate-400 hover:text-slate-700"
        >
          ×
        </button>
      </div>
    </div>
  );
}
