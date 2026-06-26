import type { MetadataRoute } from "next";

const baseUrl = "https://rivvo.cloud";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/buscar`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/planificar-viaje`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/mis-vehiculos`, lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: `${baseUrl}/favoritas`, lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: `${baseUrl}/privacidad`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${baseUrl}/aviso-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.25 },
    { url: `${baseUrl}/contacto`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
