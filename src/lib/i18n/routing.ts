import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "as-needed", // prefetch 활성화를 위해 'never'가 아닌 'as-needed' 유지
});

export type Locale = (typeof routing.locales)[number];
