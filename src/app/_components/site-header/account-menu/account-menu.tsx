"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { DropdownContent } from "@/app/_components/site-header/account-menu/dropdown-content";
import { DropdownTrigger } from "@/app/_components/site-header/account-menu/dropdown-trigger";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button>로그인</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownTrigger userImage={session.user.image ?? ""} />
      <DropdownContent userName={session.user.name ?? "사용자"} />
    </DropdownMenu>
  );
}
