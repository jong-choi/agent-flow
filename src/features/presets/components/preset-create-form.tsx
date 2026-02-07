import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getPresetChatExamplesForForm,
  getWorkflowReferencedPresetPricingSummary,
} from "@/features/presets/server/queries";
import {
  PresetChatExampleCard,
  PresetInfoCard,
  PresetPricePublishCard,
} from "@/features/presets/components/form/preset-form-sections";
import { PresetCreateSubmitButton } from "@/features/presets/components/preset-create-submit-button";

type PresetCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  submitLabel?: string;
  workflowId: string;
  chatId?: string | null;
};

export async function PresetCreateForm({
  action,
  cancelHref = "/presets",
  submitLabel = "프리셋 생성",
  workflowId,
  chatId = null,
}: PresetCreateFormProps) {
  const [{ chats, pinnedChat, defaultSelectedId }, pricingSummary] =
    await Promise.all([
      getPresetChatExamplesForForm({ workflowId, chatId }),
      getWorkflowReferencedPresetPricingSummary({ workflowId }),
    ]);

  return (
    <form action={action} className="space-y-6">
      <PresetInfoCard
        description="마켓에 노출될 프리셋 설명을 입력합니다."
        placeholders={{
          title: "예: 고객 문의 분류 + 답변 초안",
          summary: "카드에 노출될 짧은 설명을 작성해 주세요.",
          description: "프리셋의 목적, 사용 시나리오, 추천 대상 등을 적어주세요.",
        }}
        showSummaryHint
        showTags
        hiddenFields={
          <input type="hidden" name="workflowId" value={workflowId} />
        }
      />

      <PresetChatExampleCard
        chats={chats}
        pinnedChat={pinnedChat}
        defaultSelectedId={defaultSelectedId}
      />

      <PresetPricePublishCard
        description="현재 프리셋 가격을 설정합니다. 참조된 프리셋 가격이 합산되어 결제 금액이 결정됩니다."
        publishLabel="생성 후 바로 공개하기"
        publishHint="공개된 프리셋은 마켓에서 누구나 볼 수 있습니다."
        referencedPresetPrice={pricingSummary.referencedPresetPrice}
      />

      <div className="flex flex-wrap gap-2">
        <PresetCreateSubmitButton label={submitLabel} />
        <Button variant="outline" asChild>
          <Link href={cancelHref}>취소</Link>
        </Button>
      </div>
    </form>
  );
}
