import path from "path";
import { readFile } from "fs/promises";
import { DeveloperMarkdown } from "@/app/[locale]/(app)/developers/_components/developer-markdown";
import { routing, type Locale } from "@/lib/i18n/routing";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (routing.locales as readonly string[]).includes(value);

export async function ApiGuideMarkdown({ locale }: { locale: string }) {
  const safeLocale = isLocale(locale) ? locale : routing.defaultLocale;

  const resolvePath = (targetLocale: Locale) =>
    path.join(process.cwd(), "public", "docs", targetLocale, "api-guide.md");

  const read = async (targetLocale: Locale) => {
    try {
      return await readFile(resolvePath(targetLocale), "utf8");
    } catch {
      return "";
    }
  };

  const content = (await read(safeLocale)) || (await read(routing.defaultLocale));

  return (
    <DeveloperMarkdown className="px-0 py-0">{content}</DeveloperMarkdown>
  );
}
