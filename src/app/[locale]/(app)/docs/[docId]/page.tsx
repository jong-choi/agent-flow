import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, PencilLine } from "lucide-react";
import { DocumentDeleteDialog } from "@/app/[locale]/(app)/docs/[docId]/_components/document-delete-dialog";
import { DocumentSaveButton } from "@/app/[locale]/(app)/docs/[docId]/_components/document-save-button";
import { DocumentEditor } from "@/app/[locale]/(app)/docs/[docId]/_components/documents-editor";
import { DocumentTitleEditor } from "@/app/[locale]/(app)/docs/[docId]/_components/documents-title-editor";
import { DocumentStoreProvider } from "@/app/[locale]/(app)/docs/[docId]/_store/document-store";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDocumentById } from "@/db/query/documents";
import { ReactMarkdownApp } from "@/features/chat/components/markdown/react-markdown-app";
import "@/features/chat/styles/small-header-markdown.css";
import { formatKoreanDate } from "@/lib/utils";

export default async function DocumentViewPage({
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
                마지막 업데이트 {formatKoreanDate(document.updatedAt)}
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
              <div className="min-h-96 rounded-lg border border-transparent bg-accent/50 p-4 leading-relaxed break-all">
                <ReactMarkdownApp>{document.content}</ReactMarkdownApp>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </DocumentStoreProvider>
  );
}
