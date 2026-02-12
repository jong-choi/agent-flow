export const getMessage = {
  Home: {
    ko: () => import("@/lib/i18n/messages/home/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/home/en").then((m) => m.default),
  },
  Sidebar: {
    ko: () => import("@/lib/i18n/messages/sidebar/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/sidebar/en").then((m) => m.default),
  },
  Nodes: {
    ko: () => import("@/lib/i18n/messages/nodes/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/nodes/en").then((m) => m.default),
  },
  Workflows: {
    ko: () =>
      import("@/lib/i18n/messages/workflows/ko").then((m) => m.default),
    en: () =>
      import("@/lib/i18n/messages/workflows/en").then((m) => m.default),
  },
  Presets: {
    ko: () =>
      import("@/lib/i18n/messages/presets/ko").then((m) => m.default),
    en: () =>
      import("@/lib/i18n/messages/presets/en").then((m) => m.default),
  },
  Developers: {
    ko: () =>
      import("@/lib/i18n/messages/developers/ko").then((m) => m.default),
    en: () =>
      import("@/lib/i18n/messages/developers/en").then((m) => m.default),
  },
  Docs: {
    ko: () => import("@/lib/i18n/messages/docs/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/docs/en").then((m) => m.default),
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
  Chat: {
    ko: () => import("@/lib/i18n/messages/chat/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/chat/en").then((m) => m.default),
  },
  Credits: {
    ko: () => import("@/lib/i18n/messages/credits/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/credits/en").then((m) => m.default),
  },
  Auth: {
    ko: () => import("@/lib/i18n/messages/auth/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/auth/en").then((m) => m.default),
  },
  Profile: {
    ko: () => import("@/lib/i18n/messages/profile/ko").then((m) => m.default),
    en: () => import("@/lib/i18n/messages/profile/en").then((m) => m.default),
  },
};

export type AppMessageKeys = keyof typeof getMessage;
