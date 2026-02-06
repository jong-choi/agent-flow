import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  deletePresetAction,
  getOwnedPresetForEdit,
  updatePresetAction,
} from "@/features/presets/server/actions";
import { PresetEditForm } from "@/features/presets/components/preset-edit-form";

export type PresetEditRes = NonNullable<
  Awaited<ReturnType<typeof getOwnedPresetForEdit>>
>;

export default async function PresetEditPage({
  params,
}: PageProps<"/[locale]/presets/[id]/edit">) {
  const { id } = await params;
  const preset = await getOwnedPresetForEdit(id);

  if (!preset) {
    notFound();
  }

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
