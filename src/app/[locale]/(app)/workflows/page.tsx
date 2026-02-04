import Link from "next/link";
import {
  PageContainer,
  PageDescription,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { WorkflowListView } from "@/features/preset/components/workflow-list-view";

export default async function WorkflowsPage() {
  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>내 워크플로우</PageHeading>
            <PageDescription>
              플로우 캔버스에서 만든 그래프입니다.
            </PageDescription>
          </div>
          <Button asChild>
            <Link href="/workflows/canvas">새 워크플로우</Link>
          </Button>
        </div>
        <WorkflowListView />
      </div>
    </PageContainer>
  );
}
