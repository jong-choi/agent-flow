import { CreateDocumentButton } from "@/app/[locale]/(app)/docs/_components/create-document-button";
import { DocumentsGrid } from "@/app/[locale]/(app)/docs/_components/documents-grid";
import { DocumentsSearch } from "@/app/[locale]/(app)/docs/_components/documents-search";
import { DocumentsSort } from "@/app/[locale]/(app)/docs/_components/documents-sort";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { Separator } from "@/components/ui/separator";
import { getDocumentsByOwner } from "@/db/query/documents";

export default async function DocsPage({
  searchParams,
}: PageProps<"/[locale]/docs">) {
  const { q, sort: rawSort, page: rawPage } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const sort = isSort(rawSort) ? rawSort : "recent";
  const page = toPageNumber(rawPage);

  const { documents } = await getDocumentsByOwner(
    {
      query,
      sort,
    },
    { page, pageSize: 100 },
  );

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>문서 관리</PageHeading>
            <PageDescription>
              문서는 캔버스에서 불러와 활용할 수 있습니다.
            </PageDescription>
          </PageHeader>
          <CreateDocumentButton />
        </div>
        <Separator />
        <div className="flex">
          <DocumentsSort searchParams={await searchParams} />
          <DocumentsSearch />
        </div>
        <DocumentsGrid documents={documents} query={query} />
      </div>
    </PageContainer>
  );
}

const sortValues = ["latest", "oldest", "name"] as const;
type Sort = (typeof sortValues)[number];
function isSort(value: unknown): value is Sort {
  return (
    typeof value === "string" &&
    (sortValues as readonly string[]).includes(value)
  );
}

function toPageNumber(raw: unknown, fallback = 1): number {
  if (typeof raw !== "string") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1 ? n : fallback;
}
