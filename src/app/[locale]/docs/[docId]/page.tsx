import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, PencilLine } from "lucide-react";
import { ContentMarkdown } from "@/components/markdown/content-markdown";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentDeleteDialog } from "@/features/documents/components/detail/document-delete-dialog";
import { DocumentEditor } from "@/features/documents/components/detail/document-editor";
import { DocumentSaveButton } from "@/features/documents/components/detail/document-save-button";
import { DocumentTitleEditor } from "@/features/documents/components/detail/document-title-editor";
import { getDocumentById } from "@/features/documents/server/queries";
import { DocumentStoreProvider } from "@/features/documents/store/document-store";
import { formatYMD } from "@/lib/utils";

export default function DocumentViewPage(
  props: PageProps<"/[locale]/docs/[docId]">,
) {
  return (
    <Suspense fallback={<DocumentViewPageFallback />}>
      <DocumentViewContent {...props} />
    </Suspense>
  );
}

async function DocumentViewContent({
  params,
  searchParams,
}: PageProps<"/[locale]/docs/[docId]">) {
  const { docId } = await params;
  const document = await getDocumentById({ docId });

  if (!document) {
    notFound();
  }

  const { edit } = await searchParams;

  return (
    <DocumentStoreProvider
      initialValue={{
        documentTitle: document.title,
        documentContent: document.content ?? "",
      }}
    >
      <PageContainer>
        <Button variant="outline" size="sm" asChild>
          <Link href="/docs">
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
        </Button>
        <div className="flex min-h-0 flex-1 flex-col gap-6 pt-6 pb-16">
          <div className="flex flex-wrap items-start justify-between">
            <PageHeader className="flex flex-col gap-2">
              {edit ? (
                <DocumentTitleEditor />
              ) : (
                <PageHeading>{document.title}</PageHeading>
              )}
              <PageDescription className="flex items-center gap-1">
                <Calendar className="size-3" />
                마지막 업데이트 {formatYMD(document.updatedAt)}
              </PageDescription>
            </PageHeader>
            {edit ? (
              <div className="flex flex-col gap-2">
                <DocumentSaveButton docId={docId} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/docs/${docId}`}>취소</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button size="sm" asChild>
                  <Link href={`/docs/${docId}?edit=true`}>
                    <PencilLine className="size-4" />
                    수정하기
                  </Link>
                </Button>
                <DocumentDeleteDialog docId={docId} />
              </div>
            )}
          </div>
          <Separator />
          <div>
            {edit ? (
              <DocumentEditor />
            ) : (
              <ContentMarkdown className="min-h-96 rounded-lg border border-transparent bg-accent/50 p-4 leading-relaxed">
                {document.content}
              </ContentMarkdown>
            )}
          </div>
        </div>
      </PageContainer>
    </DocumentStoreProvider>
  );
}

function DocumentViewPageFallback() {
  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 pt-6 pb-16">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <Separator />
        <div className="h-72 w-full animate-pulse rounded bg-muted/70" />
      </div>
    </PageContainer>
  );
}
