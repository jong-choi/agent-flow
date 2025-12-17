import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SignOutForm } from "@/features/auth/components/sign-out-form";

export function DropdownLogoutForm() {
  return (
    <SignOutForm>
      <DropdownMenuItem>로그아웃</DropdownMenuItem>
    </SignOutForm>
  );
}
