import Link from "next/link";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownLogoutForm } from "@/features/auth/components/dropdown-logout-form";

export function DropdownContent({ userName }: { userName: string }) {
  return (
    <DropdownMenuContent className="w-56" align="start">
      <DropdownMenuLabel>{userName}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/credits/attendance">출석 체크</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">프로필 수정</Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownLogoutForm />
    </DropdownMenuContent>
  );
}
