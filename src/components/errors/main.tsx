"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function MainErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const t = useTranslations<AppMessageKeys>("ErrorBoundary");

  if (isRedirectError(error)) {
    // NEXT_REDIRECT는 바이패스로 내보내기
    throw error;
  }

  const { message } = error;

  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      role="alert"
    >
      {message ? (
        <>
          <h2 className="text-lg font-semibold">{t("withMessage")}</h2>
          <div className="text-sm text-muted-foreground">{message}</div>
        </>
      ) : (
        <h2 className="text-lg font-semibold">{t("unknown")}</h2>
      )}
      <div className="flex gap-4">
        <Button variant="default" className="mt-4" onClick={resetErrorBoundary}>
          {t("retry")}
        </Button>
        <Link href={"/"}>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={resetErrorBoundary}
          >
            {t("goHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
