import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Keep release builds within the bounded local/CI builder memory budget.
  experimental: { cpus: 1, webpackMemoryOptimizations: true },
  typescript: { ignoreBuildErrors: process.env.NEXT_BUILD_TYPECHECKED === "1" },
  reactCompiler: true,
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

export default withNextIntl(nextConfig);
