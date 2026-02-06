import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  SecondarySidebar,
  SidebarNav,
} from "@/app/[locale]/(app)/_components/sidebar";
import { AppProvider } from "@/app/[locale]/providers";
import { SiteHeader } from "@/app/_components/site-header/site-header";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/lib/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProvider>
        <div className="flex h-full w-full">
          <SidebarNav />
          <div className="flex w-full flex-col">
            <div className="sticky top-0 z-40">
              <SiteHeader />
            </div>
            <main className="flex flex-1 flex-col bg-background">
              <div className="flex h-full w-full">
                <SecondarySidebar />
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster position="top-right" richColors />
      </AppProvider>
    </NextIntlClientProvider>
  );
}
