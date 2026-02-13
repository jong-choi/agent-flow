import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const sortOptions = [
  { key: "recent", value: "recent" },
  { key: "latest", value: "latest" },
  { key: "oldest", value: "oldest" },
  { key: "name", value: "name" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];
type SearchParams = Record<string, string | string[] | undefined>;

function buildHref(searchParams: SearchParams, nextSort: SortValue) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }

  params.set("sort", nextSort);
  params.delete("page");
  params.delete("cursor");
  params.delete("dir");
  return `?${params.toString()}`;
}

export async function DocumentsSort({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: SearchParams;
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Docs",
  });
  const currentSort =
    typeof searchParams.sort === "string"
      ? (searchParams.sort as SortValue)
      : "recent";

  return (
    <div className="flex gap-2">
      {sortOptions.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant={currentSort === opt.value ? "default" : "outline"}
          asChild
        >
          <Link href={buildHref(searchParams, opt.value)} replace>
            {t(`sort.options.${opt.key}`)}
          </Link>
        </Button>
      ))}
    </div>
  );
}
