import type { NextConfig } from "next";

const isMobileExport = process.env.RIVVO_MOBILE_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isMobileExport
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default nextConfig;
