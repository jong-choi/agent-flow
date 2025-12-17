import Link from "next/link";
import { DropdownContent } from "@/app/_components/site-header/account-menu/dropdown-content";
import { DropdownTrigger } from "@/app/_components/site-header/account-menu/dropdown-trigger";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";

export async function AccountMenu() {
  const session = await auth();

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
