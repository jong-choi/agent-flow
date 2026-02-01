import Link from "next/link";
import {
  PageContainer,
  PageDescription,
  PageHeading,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnedWorkflows } from "@/db/query/workflows";

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(value);

export default async function WorkflowsPage() {
  const workflowList = await getOwnedWorkflows();

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>내 워크플로우</PageHeading>
            <PageDescription>
              플로우 캔버스에서 만든 그래프입니다.
            </PageDescription>
          </div>
          <Button asChild>
            <Link href="/canvas">새 워크플로우</Link>
          </Button>
        </div>

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
                <Link href="/canvas">워크플로우 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workflowList.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="group"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{workflow.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workflow.description ?? "설명이 없습니다."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        최근 업데이트 {formatDate(workflow.updatedAt)}
                      </span>
                      <span>생성 {formatDate(workflow.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
