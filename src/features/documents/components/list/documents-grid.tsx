import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Clock, FileText } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { formatYMD } from "@/lib/utils";

type DocumentSummary = {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export async function DocumentsGrid({
  documents,
  query,
}: {
  documents: DocumentSummary[];
  query: string;
}) {
  const t = await getTranslations<AppMessageKeys>("Docs");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {documents.length === 0 ? (
        <Card className="col-span-2 bg-background">
          <CardHeader>
            <CardTitle>
              {query ? t("grid.emptySearchTitle") : t("grid.emptyTitle")}
            </CardTitle>
            <CardDescription>
              {query
                ? t("grid.emptySearchDescription")
                : t("grid.emptyDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        documents.map((doc) => <DocumentCard key={doc.id} doc={doc} t={t} />)
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  t,
}: {
  doc: DocumentSummary;
  t: Awaited<ReturnType<typeof getTranslations<AppMessageKeys>>>;
}) {
  const buildPreview = (content: string) => {
    const trimmed = content.replace(/\s+/g, " ").trim();
    if (trimmed.length <= 50) {
      return trimmed;
    }
    return `${trimmed.slice(0, 50)}…`;
  };

  return (
    <Link href={`/docs/${doc.id}`}>
      <Card className="bg-background hover:bg-muted/50">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" />
              {doc.title}
            </CardTitle>
            <CardDescription className="h-6">
              {buildPreview(doc.content)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{t("grid.updatedAt", { date: formatYMD(doc.updatedAt) })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
