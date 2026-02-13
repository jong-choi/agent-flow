import { readFile } from "fs/promises";
import path from "path";
import { ContentMarkdown } from "@/components/markdown/content-markdown";
import { type Locale, routing } from "@/lib/i18n/routing";

type GuideDocName = "api-guide" | "openai-compat-guide";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (routing.locales as readonly string[]).includes(value);

export async function ApiGuideMarkdown({
  locale,
  docName = "api-guide",
}: {
  locale: string;
  docName?: GuideDocName;
}) {
  const safeLocale = isLocale(locale) ? locale : routing.defaultLocale;

  const resolvePath = (targetLocale: Locale) =>
    path.join(process.cwd(), "public", "docs", targetLocale, `${docName}.md`);

  const read = async (targetLocale: Locale) => {
    try {
      return await readFile(resolvePath(targetLocale), "utf8");
    } catch {
      return "";
    }
  };

  const content =
    (await read(safeLocale)) || (await read(routing.defaultLocale));

  return <ContentMarkdown className="px-8 py-4">{content}</ContentMarkdown>;
}
