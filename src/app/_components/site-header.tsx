import { Suspense } from "react";
import { LocaleSelectorButton } from "@/components/locale-selector-button";
import { BrutalLogo } from "@/components/main/ui/brutal-logo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Separator } from "@/components/ui/separator";
import { HeaderAccountMenu } from "@/features/auth/components/header-account-menu/header-account-menu";

export function SiteHeader({ locale }: { locale: string }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-6">
        <Suspense>
          <BrutalLogo />
        </Suspense>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <ThemeToggleButton />
          <FadeSuspense fallback={<HeaderLocaleFallback />}>
            <LocaleSelectorButton />
          </FadeSuspense>
        </div>
        <div className="h-5">
          <Separator orientation="vertical" />
        </div>
        <div className="flex min-w-32 justify-end">
          <FadeSuspense fallback={<HeaderAccountMenuFallback />}>
            <HeaderAccountMenu locale={locale} />
          </FadeSuspense>
        </div>
      </div>
    </header>
  );
}

function HeaderLocaleFallback() {
  return <div className="size-8" />;
}

function HeaderAccountMenuFallback() {
  return <div className="h-8 min-w-32" />;
}
