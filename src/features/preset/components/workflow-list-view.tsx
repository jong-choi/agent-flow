import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnedWorkflows } from "@/db/query/workflows";
import { WorkflowListCard } from "@/features/preset/components/workflow-list-card";

export async function WorkflowListView() {
  const workflowList = await getOwnedWorkflows();

  return (
    <>
      {workflowList.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>아직 워크플로우가 없습니다</CardTitle>
            <CardDescription>
              캔버스에서 첫 워크플로우를 만들어 보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/workflows/canvas">워크플로우 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowList.map((workflow) => (
            <WorkflowListCard
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              title={workflow.title}
              description={workflow.description}
              updatedAt={workflow.updatedAt}
              actionLabel="상세보기"
            />
          ))}
        </div>
      )}
    </>
  );
}
