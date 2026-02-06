import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export default async function NotFound() {
  const t = await getTranslations<AppMessageKeys>("NotFound");

  return (
    <div className="flex max-h-3/5 w-full items-center justify-center bg-gradient-to-b from-muted to-background text-foreground">
      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-gradient-to-r from-muted via-background to-accent px-3 py-1 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase backdrop-blur">
          404 Lost in Flow
        </div>
        <p className="text-sm text-accent-foreground sm:text-base">
          {t("description")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">{t("goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
