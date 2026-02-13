import { type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getChatsByWorkflowId } from "@/features/chats/server/queries";
import { PresetDescriptionEditor } from "@/features/presets/components/form/preset-description-editor";
import { PresetChatExampleOptions } from "@/features/presets/components/preset-chat-example-options";
import { PresetTagInput } from "@/features/presets/components/preset-tag-input";
import { categoryOptions } from "@/features/presets/constants/category-options";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { SHORT_TEXT_MAX_LENGTH } from "@/lib/utils";

const selectClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type PresetInfoCardProps = {
  locale: string;
  description: string;
  defaultValues?: {
    title?: string;
    summary?: string | null;
    description?: string | null;
    category?: string | null;
  };
  placeholders?: {
    title?: string;
    summary?: string;
    description?: string;
  };
  showSummaryHint?: boolean;
  showTags?: boolean;
  hiddenFields?: ReactNode;
};

export async function PresetInfoCard({
  locale,
  description,
  defaultValues,
  placeholders,
  showSummaryHint = false,
  showTags = false,
  hiddenFields,
}: PresetInfoCardProps) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forms.presetInfoTitle")}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hiddenFields}
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-medium">
            {t("forms.nameLabel")}
          </label>
          <Input
            id="title"
            name="title"
            placeholder={placeholders?.title}
            defaultValue={defaultValues?.title ?? ""}
            required
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="summary" className="text-sm font-medium">
            {t("forms.summaryLabel")}
          </label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            placeholder={placeholders?.summary}
            defaultValue={defaultValues?.summary ?? ""}
            maxLength={SHORT_TEXT_MAX_LENGTH}
          />
          {showSummaryHint && (
            <p className="text-xs text-muted-foreground">
              {t("forms.summaryHint")}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            {t("forms.descriptionLabel")}
          </label>

          <PresetDescriptionEditor
            id="description"
            name="description"
            placeholder={placeholders?.description}
            defaultValue={defaultValues?.description ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="category" className="text-sm font-medium">
            {t("forms.categoryLabel")}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className={selectClassName}
          >
            {categoryOptions.map((option) => (
              <option key={option.value || option.key} value={option.value}>
                {t(`categories.${option.key}`)}
              </option>
            ))}
          </select>
        </div>
        {showTags && <PresetTagInput />}
      </CardContent>
    </Card>
  );
}

type PresetChatExampleCardProps = {
  locale: string;
  workflowId: string;
  defaultSelectedId?: string | null;
};

export async function PresetChatExampleCard({
  locale,
  workflowId,
  defaultSelectedId = null,
}: PresetChatExampleCardProps) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const chats = await getChatsByWorkflowId({ workflowId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("chatExampleCard.title")}</CardTitle>
        <CardDescription>{t("chatExampleCard.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <PresetChatExampleOptions
          chats={chats}
          defaultSelectedId={defaultSelectedId}
        />
      </CardContent>
    </Card>
  );
}

export function PresetChatExampleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export {
  PresetPricePublishCard,
  type PresetPricePublishCardProps,
} from "@/features/presets/components/form/preset-price-publish-card";
