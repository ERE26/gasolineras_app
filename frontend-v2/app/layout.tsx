import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gasolineras App | Ahorra al repostar",
  description:
    "Compara precios oficiales de gasolineras en España, busca cerca de ti y planifica dónde repostar en ruta.",
  applicationName: "Gasolineras App",
  keywords: [
    "gasolineras",
    "precio gasolina",
    "diesel barato",
    "gasolineras España",
    "repostar barato",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f7f9fc] text-slate-950">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
