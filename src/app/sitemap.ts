import { type MetadataRoute } from "next";

const BASE_URL = "https://agentflow.jongchoi.com";
const LOCALES = ["ko", "en"] as const;

const staticPaths = [
  "/",
  "/login",
  "/chat",
  "/presets",
  "/workflows",
  "/credits",
  "/developers",
  "/docs",
  "/profile",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${path === "/" ? "" : path}`,
      lastModified: new Date(),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1.0 : 0.5,
    })),
  );
}
