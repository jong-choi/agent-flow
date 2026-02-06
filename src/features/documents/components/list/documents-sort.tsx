import Link from "next/link";
import { Button } from "@/components/ui/button";

const sortOptions = [
  { label: "최근 업데이트 순", value: "recent" },
  { label: "최신순", value: "latest" },
  { label: "오래된 순", value: "oldest" },
  { label: "이름 순", value: "name" },
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
  return `?${params.toString()}`;
}

export function DocumentsSort({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
            {opt.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
