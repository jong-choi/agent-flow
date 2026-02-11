import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DevLoginForm } from "@/features/auth/components/dev-login/dev-login-form";
import { getTranslations } from "next-intl/server";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function DevLoginCardContent() {
  const t = await getTranslations<AppMessageKeys>("Auth");

  return (
    <CardContent className="flex w-full flex-col items-center gap-2">
      <Separator className="my-4" />
      <p className="text-muted-foreground">{t("login.devSectionTitle")}</p>
      <DevLoginForm />
    </CardContent>
  );
}
