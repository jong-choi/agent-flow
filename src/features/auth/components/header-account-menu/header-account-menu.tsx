import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { HeaderAccountMenuContent } from "@/features/auth/components/header-account-menu/header-account-menu-content";
import { HeaderAccountMenuTrigger } from "@/features/auth/components/header-account-menu/header-account-menu-trigger";
import { HeaderCreditsButton } from "@/features/credits/components/header-credits-button";
import { auth } from "@/lib/auth";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function HeaderAccountMenu({ locale }: { locale: string }) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Auth",
  });
  const session = await auth();

  if (!session?.user || !session?.user.id) {
    return (
      <Button asChild>
        <Link href="/login">{t("header.login")}</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <FadeSuspense fallback={<CreditButtonFallback />}>
          <HeaderCreditsButton />
        </FadeSuspense>
        <DropdownMenu>
          <HeaderAccountMenuTrigger
            avatarHash={session.user.avatarHash ?? "default"}
          />
          <HeaderAccountMenuContent
            locale={locale}
            userName={session.user.displayName ?? t("header.defaultUser")}
          />
        </DropdownMenu>
      </div>
    </div>
  );
}

function CreditButtonFallback() {
  return <Skeleton className="h-8 w-19 rounded-lg" />;
}
