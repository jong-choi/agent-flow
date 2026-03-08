import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "never" as "as-needed" | "always" | "never",
});

export type Locale = (typeof routing.locales)[number];
