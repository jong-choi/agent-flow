import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db/client";
import { createPreset } from "@/db/query/presets";
import { users, workflows } from "@/db/schema";
import { PresetCreateForm } from "@/features/preset/components/preset-create-form";
import { auth } from "@/lib/auth";
import { formatKoreanDate } from "@/lib/utils";
import { normalizeOptionalText } from "@/app/[locale]/(app)/presets/_utils/form-utils";

export default async function PresetCreateDetailPage({
  params,
}: PageProps<"/[locale]/presets/new/[workflowId]">) {
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

  const { workflowId } = await params;
  const [workflow] = await db
    .select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, user.id)))
    .limit(1);

  if (!workflow) {
    notFound();
  }

  const createPresetAction = async (formData: FormData) => {
    "use server";

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

    const titleValue = formData.get("title");

    if (typeof titleValue !== "string" || titleValue.trim() === "") {
      return;
    }

    const description = normalizeOptionalText(formData.get("description"));
    const summary = normalizeOptionalText(formData.get("summary"));
    const category = normalizeOptionalText(formData.get("category"));
    const priceValue = formData.get("price");
    const isPublished = formData.get("isPublished") === "on";
    const tagValues = formData.getAll("tags");
    const tags = Array.from(
      new Map(
        tagValues
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value !== "")
          .map((value) => [value.toLowerCase(), value]),
      ).values(),
    );

    let price = 0;
    if (typeof priceValue === "string" && priceValue.trim() !== "") {
      const parsed = Number(priceValue);
      price = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
    }

    const preset = await createPreset({
      ownerId: user.id,
      workflowId: workflow.id,
      title: titleValue.trim(),
      description,
      summary,
      category,
      price,
      isPublished,
      tags,
    });

    if (!preset) {
      notFound();
    }

    redirect(`/presets/${preset.id}`);
  };

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 프리셋 · 2/2</p>
            <h1 className="text-2xl font-semibold">프리셋 정보 입력</h1>
            <p className="text-sm text-muted-foreground">
              선택한 워크플로우를 프리셋으로 저장합니다.
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

        <Card>
          <CardHeader>
            <CardTitle>선택한 워크플로우</CardTitle>
            <CardDescription>
              다른 워크플로우로 변경하려면 돌아가기를 눌러주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{workflow.title}</p>
              <p className="text-xs text-muted-foreground">
                {workflow.description ?? "설명이 없습니다."}
              </p>
              <p className="text-xs text-muted-foreground">
                최근 업데이트 {formatKoreanDate(workflow.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/presets/new">워크플로우 변경</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${workflow.id}`}>워크플로우 보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <PresetCreateForm
          action={createPresetAction}
          cancelHref="/presets/new"
        />
      </div>
    </PageContainer>
  );
}
