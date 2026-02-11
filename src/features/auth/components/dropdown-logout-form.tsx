import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SignOutForm } from "@/features/auth/components/sign-out-form";
import { getTranslations } from "next-intl/server";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function DropdownLogoutForm() {
  const t = await getTranslations<AppMessageKeys>("Auth");

  return (
    <SignOutForm>
      <DropdownMenuItem>{t("menu.logout")}</DropdownMenuItem>
    </SignOutForm>
  );
}
