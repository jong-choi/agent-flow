import Link from "next/link";
import { Sparkle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getCreditBalance } from "@/features/credits/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function HeaderCreditsButton() {
  const t = await getTranslations<AppMessageKeys>("Credits");
  const balance = await getCreditBalance();

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="h-7 min-w-18 text-xs shadow-none"
      title={t("header.currentCreditsTitle")}
    >
      <Link
        href="/credits"
        aria-label={t("header.viewCreditsAria")}
        className="flex items-center"
      >
        <Sparkle className="size-3 fill-current" />
        <span>{balance}</span>
      </Link>
    </Button>
  );
}
