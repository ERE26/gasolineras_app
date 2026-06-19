import { Analytics } from "@vercel/analytics/next";
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
  title: "Rivvo | Ahorro inteligente en repostaje",
  description:
    "Rivvo te ayuda a encontrar gasolineras, guardar favoritas, comparar precios y planificar tus viajes con un enfoque inteligente en ahorro y movilidad.",
  applicationName: "Rivvo",
  icons: {
    icon: "/brand/rivvo-app-icon.png",
    apple: "/brand/rivvo-app-icon.png",
  },
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
      <body className="min-h-full flex flex-col bg-[var(--rivvo-surface)] text-slate-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
