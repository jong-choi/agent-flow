import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";

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
  submitLabel,
  workflowId,
  chatId = null,
}: PresetCreateFormProps) {
  const t = await getTranslations<AppMessageKeys>("Presets");
  const resolvedSubmitLabel = submitLabel ?? t("forms.createSubmit");
  const [{ chats, pinnedChat, defaultSelectedId }, pricingSummary] =
    await Promise.all([
      getPresetChatExamplesForForm({ workflowId, chatId }),
      getWorkflowReferencedPresetPricingSummary({ workflowId }),
    ]);

  return (
    <form action={action} className="space-y-6">
      <PresetInfoCard
        description={t("forms.presetInfoDescriptionCreate")}
        placeholders={{
          title: t("forms.placeholderTitle"),
          summary: t("forms.placeholderSummary"),
          description: t("forms.placeholderDescription"),
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
        description={t("forms.pricePublishDescriptionCreate")}
        publishLabel={t("forms.publishLabelCreate")}
        publishHint={t("forms.publishHintCreate")}
        referencedPresetPrice={pricingSummary.referencedPresetPrice}
      />

      <div className="flex flex-wrap gap-2">
        <PresetCreateSubmitButton label={resolvedSubmitLabel} />
        <Button variant="outline" asChild>
          <Link href={cancelHref}>{t("forms.cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
