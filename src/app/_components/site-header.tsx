import { HeaderAccountMenu } from "@/features/auth/components/header-account-menu/header-account-menu";
import { LocaleSelectorButton } from "@/components/locale-selector-button";
import { Logo } from "@/components/logo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Separator } from "@/components/ui/separator";

export const DVH_HEADER_OFFSET = "h-[calc(100dvh-3.5rem)]";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background px-6">
      {/* Left Area */}
      <div className="flex items-center gap-6">
        <Logo />
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <ThemeToggleButton />
          <LocaleSelectorButton />
        </div>
        <div className="h-5">
          <Separator orientation="vertical" />
        </div>
        <div className="flex min-w-32 justify-end">
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}
