import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronLeft } from "lucide-react";
import "@xyflow/react/dist/style.css";
import {
  PageContainer,
  PageContentTitle,
  PageDescription,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";
import { auth } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/utils";

export default async function WorkflowDetailPage({
  params,
}: PageProps<"/[locale]/presets/workflows/[id]">) {
  const { id } = await params;
  const workflowData = await getWorkflowWithGraph(id);
  const session = await auth();
  const userId = session?.user?.id;

  if (!workflowData || workflowData.workflow.ownerId !== userId) {
    notFound();
  }

  const { workflow, nodes, edges } = workflowData;

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/presets/workflows">
                <ChevronLeft />
                목록으로
              </Link>
            </Button>
            <div className="w-full space-y-1 pt-4 pl-4">
              <PageContentTitle>{workflow.title}</PageContentTitle>
              <PageDescription>
                {workflow.description ?? "설명이 없습니다."}
              </PageDescription>
              <div className="flex w-full items-center gap-1 pt-4 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                <div>최근 업데이트 {formatKoreanDate(workflow.updatedAt)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/canvas/${workflow.id}`}>캔버스에서 열기</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>그래프 프리뷰</CardTitle>
            </CardHeader>
            <CardContent>
              <CanvasPreview nodes={nodes} edges={edges} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>노드 목록</CardTitle>
              <CardDescription>
                워크플로우에 포함된 노드를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  노드가 아직 없습니다.
                </p>
              ) : (
                <div className="scrollbar-slim max-h-80 space-y-3 overflow-auto pr-2">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-start justify-between gap-4 rounded-lg border bg-background/70 px-3 py-2"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">{node.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {node.description ?? "설명이 없습니다."}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {node.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>워크플로우 요약</CardTitle>
              <CardDescription>그래프 통계와 기록</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">노드</span>
                  <span className="font-medium">{nodes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">엣지</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
