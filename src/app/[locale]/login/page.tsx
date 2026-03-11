import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BrutalCI } from "@/components/main/ui/brutal-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { DevLoginCardContent } from "@/features/auth/components/dev-login/dev-login-card-content";
import {
  GoogleLoginForm,
  GoogleLoginFormFallback,
} from "@/features/auth/components/google-login-form";
import { ENABLE_DEV_LOGIN } from "@/lib/auth";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Auth",
  });

  return {
    title: t("meta.loginTitle"),
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Auth",
  });

  return (
    <div className="relative flex min-h-[calc(80vh-3.5rem)] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-muted to-background p-4">
      {/* Login Card */}
      <Card className="min-w-[420px] border-border/50 dark:bg-accent">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl" />
                <div className="relative transform transition-transform duration-500 hover:scale-110">
                  <Suspense>
                    <BrutalCI />
                  </Suspense>
                </div>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <FadeSuspense
            fallback={
              <GoogleLoginFormFallback
                className="mt-0"
                label={t("login.googleContinue")}
              />
            }
          >
            <GoogleLoginForm
              locale={locale}
              label={t("login.googleContinue")}
              className="mt-0"
              searchParams={searchParams}
            />
          </FadeSuspense>

          {ENABLE_DEV_LOGIN && (
            <div className="rounded-lg bg-muted/30 p-1">
              <DevLoginCardContent locale={locale} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
