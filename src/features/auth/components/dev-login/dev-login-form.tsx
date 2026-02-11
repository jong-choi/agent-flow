import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { devPasswordSignIn } from "@/features/auth/utils/auth-actions";
import { getTranslations } from "next-intl/server";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function DevLoginForm() {
  const t = await getTranslations<AppMessageKeys>("Auth");

  return (
    <form
      action={devPasswordSignIn}
      className="flex w-full flex-col items-center gap-3"
    >
      <Input
        id="dev-password"
        name="password"
        autoComplete="off"
        type="password"
        placeholder={t("login.devPasswordPlaceholder")}
        className="w-full text-center"
      />
      <Button type="submit" className="w-full">
        {t("login.devPasswordSubmit")}
      </Button>
    </form>
  );
}
