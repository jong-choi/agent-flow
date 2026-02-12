import { type Locale } from "@/lib/i18n/routing";

export const canvasTags = {
  sidebarNodes: (locale?: Locale) =>
    locale ? `canvas:sidebar-nodes:${locale}` : "canvas:sidebar-nodes",
  activeAiModels: () => "ai-models:active",
} as const;
