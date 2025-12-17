import { Suspense } from "react";
import { AccountMenu } from "@/app/_components/site-header/account-menu/account-menu";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  return (
    <div className="sticky top-0 flex w-full justify-between">
      {/* 왼쪽 영역 */}
      <div>Logo</div>
      {/* 오른쪽 영역 */}
      <div className="flex gap-2">
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <AccountMenu />
        </Suspense>
        <ThemeToggleButton />
      </div>
    </div>
  );
}
