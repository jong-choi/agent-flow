import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db/client";
import { users, workflows } from "@/db/schema";
import { auth } from "@/lib/auth";

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(value);

export default async function WorkflowsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const workflowList = await db
    .select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(eq(workflows.ownerId, user.id))
    .orderBy(desc(workflows.updatedAt));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 워크플로우</p>
            <h1 className="text-2xl font-semibold">워크플로우</h1>
            <p className="text-sm text-muted-foreground">
              플로우 캔버스에서 만든 그래프를 모아봅니다.
            </p>
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
    </div>
  );
}
