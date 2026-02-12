import { getTranslations } from "next-intl/server";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SignOutForm } from "@/features/auth/components/sign-out-form";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function DropdownLogoutForm({ locale }: { locale: string }) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Auth",
  });

  return (
    <SignOutForm>
      <DropdownMenuItem>{t("menu.logout")}</DropdownMenuItem>
    </SignOutForm>
  );
}
