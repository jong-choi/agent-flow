import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { type PresetEditRes } from "@/app/[locale]/presets/[id]/edit/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PresetChatExampleCard,
  PresetChatExampleCardSkeleton,
  PresetInfoCard,
  PresetPricePublishCard,
} from "@/features/presets/components/form/preset-form-sections";
import { getWorkflowReferencedPresetPricingSummary } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { formatYMD } from "@/lib/utils";

type PresetEditFormProps = {
  locale: string;
  preset: PresetEditRes;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export async function PresetEditForm({
  locale,
  preset,
  updateAction,
  deleteAction,
}: PresetEditFormProps) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const pricingSummary = await getWorkflowReferencedPresetPricingSummary({
    workflowId: preset.workflowId,
    excludePresetId: preset.id,
  });

  return (
    <div className="space-y-6">
      <form action={updateAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("forms.workflowInfoTitle")}</CardTitle>
            <CardDescription>
              {t("forms.workflowInfoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {preset.workflowTitle ?? t("forms.workflowFallback")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("forms.workflowUpdatedAt", {
                  date: formatYMD(preset.workflowUpdatedAt),
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workflows/${preset.workflowId}`}>
                {t("forms.viewWorkflow")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <PresetInfoCard
          locale={locale}
          description={t("forms.presetInfoDescriptionEdit")}
          defaultValues={{
            title: preset.title,
            summary: preset.summary,
            description: preset.description,
            category: preset.category,
          }}
          hiddenFields={
            <input type="hidden" name="presetId" value={preset.id} />
          }
        />

        <Suspense fallback={<PresetChatExampleCardSkeleton />}>
          <PresetChatExampleCard
            locale={locale}
            workflowId={preset.workflowId}
            defaultSelectedId={preset.chatId}
          />
        </Suspense>

        <PresetPricePublishCard
          description={t("forms.pricePublishDescriptionEdit")}
          priceDefault={preset.price}
          publishLabel={t("forms.publishLabelEdit")}
          publishHint={t("forms.publishHintEdit")}
          isPublishedDefault={preset.isPublished}
          referencedPresetPrice={pricingSummary.referencedPresetPrice}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit">{t("forms.saveEdit")}</Button>
          <Button variant="outline" asChild>
            <Link href={`/presets/${preset.id}`}>{t("forms.cancel")}</Link>
          </Button>
        </div>
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="presetId" value={preset.id} />
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("forms.deleteTitle")}
            </CardTitle>
            <CardDescription>{t("forms.deleteDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" type="submit">
              {t("forms.deleteButton")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
