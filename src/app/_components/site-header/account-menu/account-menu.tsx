"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { DropdownContent } from "@/app/_components/site-header/account-menu/dropdown-content";
import { DropdownTrigger } from "@/app/_components/site-header/account-menu/dropdown-trigger";
import { CreditsButton } from "@/app/_components/site-header/credits-button";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-19 rounded-lg" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

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
        <CreditsButton />
        <DropdownMenu>
          <DropdownTrigger avatarHash={session.user.avatarHash ?? "default"} />
          <DropdownContent userName={session.user.displayName ?? "사용자"} />
        </DropdownMenu>
      </div>
    </div>
  );
}
