import Link from "next/link";
import { PageContainer } from "@/components/page-template";
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

export default async function PresetCreatePage() {
  const workflowList = await getOwnedWorkflows();

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 프리셋 · 1/2</p>
            <h1 className="text-2xl font-semibold">워크플로우 선택</h1>
            <p className="text-sm text-muted-foreground">
              프리셋으로 저장할 워크플로우를 선택하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets">프리셋 마켓</Link>
            </Button>
            <Button asChild>
              <Link href="/presets/purchased">내 프리셋</Link>
            </Button>
          </div>
        </div>

        {workflowList.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>워크플로우가 없습니다</CardTitle>
              <CardDescription>
                캔버스에서 워크플로우를 만든 뒤 프리셋을 생성해 주세요.
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
                href={`/presets/new/${workflow.id}`}
                title={workflow.title}
                description={workflow.description}
                updatedAt={workflow.updatedAt}
                actionLabel="선택하기"
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
