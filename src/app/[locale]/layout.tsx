import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AppProvider } from "@/app/[locale]/providers";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/lib/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProvider>
        <main className="flex h-screen flex-col">{children}</main>
        <Toaster position="top-right" richColors />
      </AppProvider>
    </NextIntlClientProvider>
  );
}
