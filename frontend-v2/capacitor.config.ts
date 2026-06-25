import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.rivvo.mobile",
  appName: "Rivvo",
  webDir: "public",
  server: {
    url: "https://gasolineras-app-mu.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
