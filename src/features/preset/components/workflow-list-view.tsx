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
import { formatKoreanDate } from "@/lib/utils";

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
              <Link href="/canvas">워크플로우 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowList.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/presets/workflows/${workflow.id}`}
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
                      최근 업데이트 {formatKoreanDate(workflow.updatedAt)}
                    </span>
                    <span>생성 {formatKoreanDate(workflow.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
