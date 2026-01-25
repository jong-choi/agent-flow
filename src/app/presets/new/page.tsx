import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { createPreset } from "@/db/query/presets";
import { users, workflows } from "@/db/schema";
import { PresetCreateForm } from "@/features/preset/components/preset-create-form";
import { auth } from "@/lib/auth";

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export default async function PresetCreatePage() {
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

  const workflowList = await db
    .select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(eq(workflows.ownerId, user.id))
    .orderBy(desc(workflows.updatedAt));

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

    const workflowIdValue = formData.get("workflowId");
    const titleValue = formData.get("title");

    if (typeof workflowIdValue !== "string" || workflowIdValue === "") {
      return;
    }

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

    const preset = await createPreset({
      ownerId: user.id,
      workflowId: workflowIdValue,
      title: titleValue.trim(),
      description,
      summary,
      category,
      price,
      isPublished,
    });

    if (!preset) {
      notFound();
    }

    redirect(`/presets/${preset.id}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 프리셋</p>
            <h1 className="text-2xl font-semibold">프리셋 만들기</h1>
            <p className="text-sm text-muted-foreground">
              워크플로우를 선택하고 프리셋 정보를 입력하세요.
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

        <PresetCreateForm
          workflows={workflowList}
          action={createPresetAction}
        />
      </div>
    </div>
  );
}
