export const getMessage = {
  Home: {
    ko: () => import("@/lib/i18n/messages/home/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/home/en").then((m) => m.default),
  },
  ErrorBoundary: {
    ko: () =>
      import("@/lib/i18n/messages/error-boundary/ko").then((m) => m.default),
    en: () =>
      import("@/lib/i18n/messages/error-boundary/en").then((m) => m.default),
  },
  NotFound: {
    ko: () => import("@/lib/i18n/messages/not-found/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/not-found/en").then((m) => m.default),
  },
};

export type AppMessageKeys = keyof typeof getMessage;
