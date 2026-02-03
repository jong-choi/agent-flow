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
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { WorkflowDataView } from "@/features/preset/components/workflow-data-view";
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

        <WorkflowDataView nodes={nodes} edges={edges} />
      </div>
    </PageContainer>
  );
}
