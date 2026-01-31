import { revalidateTag } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { deletePreset, updatePreset } from "@/db/query/presets";
import { presets, users, workflows } from "@/db/schema";
import { PresetEditForm } from "@/features/preset/components/preset-edit-form";
import { auth } from "@/lib/auth";
import { normalizeOptionalText } from "@/app/[locale]/(app)/presets/_utils/form-utils";

export default async function PresetEditPage({
  params,
}: PageProps<"/[locale]/presets/[id]/edit">) {
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

  const { id } = await params;
  const [preset] = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      workflowTitle: workflows.title,
      workflowUpdatedAt: workflows.updatedAt,
      title: presets.title,
      summary: presets.summary,
      description: presets.description,
      category: presets.category,
      price: presets.price,
      isPublished: presets.isPublished,
    })
    .from(presets)
    .innerJoin(workflows, eq(workflows.id, presets.workflowId))
    .where(and(eq(presets.id, id), eq(presets.ownerId, user.id)))
    .limit(1);

  if (!preset) {
    notFound();
  }

  const updatePresetAction = async (formData: FormData) => {
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

    let price = 0;
    if (typeof priceValue === "string" && priceValue.trim() !== "") {
      const parsed = Number(priceValue);
      price = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
    }

    const updated = await updatePreset({
      presetId: id,
      ownerId: user.id,
      title: titleValue.trim(),
      description,
      summary,
      category,
      price,
      isPublished,
    });

    if (!updated) {
      notFound();
    }

    revalidateTag("preset_detail", "default");
    redirect(`/presets/${id}`);
  };

  const deletePresetAction = async () => {
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

    const deleted = await deletePreset({ presetId: id, ownerId: user.id });

    if (!deleted) {
      notFound();
    }

    revalidateTag("preset_detail", "default");
    redirect("/presets");
  };

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 프리셋</p>
            <h1 className="text-2xl font-semibold">프리셋 수정</h1>
            <p className="text-sm text-muted-foreground">
              프리셋 정보를 수정하거나 삭제할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/presets/${preset.id}`}>상세 페이지</Link>
            </Button>
            <Button asChild>
              <Link href="/presets">프리셋 마켓</Link>
            </Button>
          </div>
        </div>

        <PresetEditForm
          preset={preset}
          updateAction={updatePresetAction}
          deleteAction={deletePresetAction}
        />
      </div>
    </PageContainer>
  );
}
