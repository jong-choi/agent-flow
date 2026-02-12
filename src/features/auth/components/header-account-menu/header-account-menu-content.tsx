import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DropdownLogoutForm } from "@/features/auth/components/dropdown-logout-form";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function HeaderAccountMenuContent({
  userName,
}: {
  userName: string;
}) {
  const t = await getTranslations<AppMessageKeys>("Auth");

  return (
    <DropdownMenuContent className="w-56" align="start">
      <DropdownMenuLabel>{userName}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/credits/attendance">{t("menu.attendance")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">{t("menu.editProfile")}</Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownLogoutForm />
    </DropdownMenuContent>
  );
}
