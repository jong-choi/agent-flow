import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { HeaderAccountMenuContent } from "@/features/auth/components/header-account-menu/header-account-menu-content";
import { HeaderAccountMenuTrigger } from "@/features/auth/components/header-account-menu/header-account-menu-trigger";
import { HeaderCreditsButton } from "@/features/credits/components/header-credits-button";
import { auth } from "@/lib/auth";

export async function HeaderAccountMenu() {
  const session = await auth();

  if (!session?.user || !session?.user.id) {
    return (
      <Button asChild>
        <Link href="/login">로그인</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <Suspense fallback={<CreditButtonFallback />}>
          <HeaderCreditsButton />
        </Suspense>
        <DropdownMenu>
          <HeaderAccountMenuTrigger
            avatarHash={session.user.avatarHash ?? "default"}
          />
          <HeaderAccountMenuContent
            userName={session.user.displayName ?? "사용자"}
          />
        </DropdownMenu>
      </div>
    </div>
  );
}

function CreditButtonFallback() {
  return <Skeleton className="h-8 w-19 rounded-lg" />;
}
