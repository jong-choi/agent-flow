import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export default async function NotFound() {
  const t = await getTranslations<AppMessageKeys>("NotFound");

  return (
    <div className="mt-52 flex flex-col items-center font-semibold">
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <Link href={"/"} replace>
        {t("goHome")}
      </Link>
    </div>
  );
}
