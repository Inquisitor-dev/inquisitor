import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 300000,
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), "src/styles")],
    silenceDeprecations: ["legacy-js-api"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3001/:path*",
      },
    ];
  },
  async headers() {
    // public/ altındaki oyun görselleri: bir gün önbellekte kalır, sonra arka planda tazelenir.
    // Dosya adları sabit olduğu için daha uzun (immutable) önbellek güncellemeleri geciktirirdi.
    const assetCache = {
      key: "Cache-Control",
      value: "public, max-age=86400, stale-while-revalidate=604800",
    };
    const assetDirs = ["map", "backgrounds", "dialogue", "characters", "stories", "avatars"];
    return [
      ...assetDirs.map((dir) => ({ source: `/${dir}/:file+`, headers: [assetCache] })),
      {
        source: "/map",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
