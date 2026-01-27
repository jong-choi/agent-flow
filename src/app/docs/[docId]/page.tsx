import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Pencil } from "lucide-react";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db/client";
import { deleteDocumentAction, getDocumentById } from "@/db/query/documents";
import { users } from "@/db/schema/auth";
import { DocumentDeleteDialog } from "@/app/docs/document-delete-dialog";
import { ReactMarkdownApp } from "@/features/chat/components/markdown/react-markdown-app";
import "@/features/chat/styles/small-header-markdown.css";
import { auth } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/utils";

export default async function DocumentViewPage({
  params,
}: PageProps<"/docs/[docId]">) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const { docId } = await params;
  const document = await getDocumentById({ docId, ownerId: user.id });

  if (!document) {
    notFound();
  }


  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs">
                <ArrowLeft className="size-4" />
                목록으로
              </Link>
            </Button>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">내 문서</p>
              <h1 className="text-2xl font-semibold">{document.title}</h1>
              <p className="text-sm text-muted-foreground">
                마크다운 문서 상세 내용을 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                업데이트 {formatKoreanDate(document.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="ml-auto">
              <Link href={`/docs/edit/${document.id}`}>
                <Pencil className="size-4" />
                수정
              </Link>
            </Button>
            <DocumentDeleteDialog
              docId={document.id}
              deleteAction={deleteDocumentAction}
            />
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>문서 내용</CardTitle>
            <CardDescription>마크다운으로 저장된 내용을 렌더링합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="new-york-small leading-relaxed">
              <ReactMarkdownApp>{document.content}</ReactMarkdownApp>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
