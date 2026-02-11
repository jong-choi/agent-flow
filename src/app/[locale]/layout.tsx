import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AppProvider } from "@/app/[locale]/providers";
import { SidebarNav } from "@/app/_components/sidebar";
import { SiteHeader } from "@/app/_components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { type Locale, routing } from "@/lib/i18n/routing";

const localeMetadata: Record<
  Locale,
  {
    description: string;
    keywords: string[];
    openGraphLocale: string;
  }
> = {
  ko: {
    description: "랭그래프를 플로우 차트로 만드는 사이트",
    keywords: [
      "AgentFlow",
      "LangGraph",
      "flow chart",
      "랭그래프",
      "플로우차트",
    ],
    openGraphLocale: "ko_KR",
  },
  en: {
    description: "A visual platform for building LangGraph workflows.",
    keywords: [
      "AgentFlow",
      "LangGraph",
      "workflow",
      "flow chart",
      "AI agent builder",
    ],
    openGraphLocale: "en_US",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const metadata = localeMetadata[locale];

  return {
    title: {
      default: "AgentFlow",
      template: "%s - AgentFlow",
    },
    robots: { index: true, follow: true },
    authors: [{ name: "AgentFlow Team" }],
    creator: "AgentFlow",
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: {
      type: "website",
      url: "/",
      title: {
        default: "AgentFlow",
        template: "%s - AgentFlow",
      },
      description: metadata.description,
      siteName: "AgentFlow",
      locale: metadata.openGraphLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: "AgentFlow",
        template: "%s - AgentFlow",
      },
      description: metadata.description,
    },
  };
}

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProvider>
            <div className="flex h-full w-full">
              <SidebarNav />
              <div className="flex w-full flex-col">
                <div className="sticky top-0 z-40">
                  <SiteHeader />
                </div>
                <main className="flex flex-1 flex-col bg-background">
                  <div className="flex h-full w-full">{children}</div>
                </main>
              </div>
            </div>
            <Toaster position="top-right" richColors />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
