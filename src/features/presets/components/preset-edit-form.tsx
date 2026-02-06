import Link from "next/link";
import { type PresetEditRes } from "@/app/[locale]/(app)/presets/[id]/edit/page";
import { Button } from "@/components/ui/button";
import {
  getPresetChatExamplesForForm,
  getWorkflowReferencedPresetPricingSummary,
} from "@/features/presets/server/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PresetChatExampleCard,
  PresetInfoCard,
  PresetPricePublishCard,
} from "@/features/presets/components/form/preset-form-sections";
import { formatKoreanDate } from "@/lib/utils";

type PresetEditFormProps = {
  preset: PresetEditRes;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export async function PresetEditForm({
  preset,
  updateAction,
  deleteAction,
}: PresetEditFormProps) {
  const [{ chats, pinnedChat, defaultSelectedId }, pricingSummary] =
    await Promise.all([
      getPresetChatExamplesForForm({
        workflowId: preset.workflowId,
        chatId: preset.chatId,
      }),
      getWorkflowReferencedPresetPricingSummary({
        workflowId: preset.workflowId,
        excludePresetId: preset.id,
      }),
    ]);

  return (
    <div className="space-y-6">
      <form action={updateAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>워크플로우 정보</CardTitle>
            <CardDescription>프리셋이 연결된 워크플로우</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {preset.workflowTitle ?? "워크플로우"}
              </p>
              <p className="text-xs text-muted-foreground">
                최근 업데이트{" "}
                {formatKoreanDate(preset.workflowUpdatedAt, "날짜 없음")}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workflows/${preset.workflowId}`}>
                워크플로우 보기
              </Link>
            </Button>
          </CardContent>
        </Card>

        <PresetInfoCard
          description="마켓에 보여질 정보를 수정합니다."
          defaultValues={{
            title: preset.title,
            summary: preset.summary,
            description: preset.description,
            category: preset.category,
          }}
          hiddenFields={<input type="hidden" name="presetId" value={preset.id} />}
        />

        <PresetChatExampleCard
          chats={chats}
          pinnedChat={pinnedChat}
          defaultSelectedId={defaultSelectedId}
        />

        <PresetPricePublishCard
          description="현재 프리셋 가격과 공개 여부를 조정합니다. 참조된 프리셋 가격이 합산되어 결제 금액이 결정됩니다."
          priceDefault={preset.price}
          publishLabel="마켓에 공개"
          publishHint="공개하면 마켓에서 누구나 확인할 수 있습니다."
          isPublishedDefault={preset.isPublished}
          referencedPresetPrice={pricingSummary.referencedPresetPrice}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit">수정 저장</Button>
          <Button variant="outline" asChild>
            <Link href={`/presets/${preset.id}`}>취소</Link>
          </Button>
        </div>
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="presetId" value={preset.id} />
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">프리셋 삭제</CardTitle>
            <CardDescription>
              삭제하면 복구할 수 없습니다. 신중하게 진행하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" type="submit">
              프리셋 삭제
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
