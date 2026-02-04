import { type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PresetDescriptionEditor } from "@/features/preset/components/form/preset-description-editor";
import {
  type ChatExample,
  PresetChatExampleOptions,
} from "@/features/preset/components/preset-chat-example-options";
import { PresetTagInput } from "@/features/preset/components/preset-tag-input";
import { categoryOptions } from "@/features/preset/constants/category-options";

const selectClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type PresetInfoCardProps = {
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

export function PresetInfoCard({
  description,
  defaultValues,
  placeholders,
  showSummaryHint = false,
  showTags = false,
  hiddenFields,
}: PresetInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>프리셋 정보</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hiddenFields}
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-medium">
            프리셋 이름
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
            요약
          </label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            placeholder={placeholders?.summary}
            defaultValue={defaultValues?.summary ?? ""}
          />
          {showSummaryHint && (
            <p className="text-xs text-muted-foreground">
              마켓 리스트 카드에 표시됩니다.
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            상세 설명
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
            카테고리
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className={selectClassName}
          >
            {categoryOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
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
  chats: ChatExample[];
  pinnedChat?: ChatExample | null;
  defaultSelectedId?: string | null;
};

export function PresetChatExampleCard({
  chats,
  pinnedChat = null,
  defaultSelectedId = null,
}: PresetChatExampleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>채팅 예시</CardTitle>
        <CardDescription>
          마켓에 노출될 채팅 예시를 선택합니다. 선택된 채팅은 최대 4개의
          메시지를 노출합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PresetChatExampleOptions
          chats={chats}
          pinnedChat={pinnedChat}
          defaultSelectedId={defaultSelectedId}
        />
      </CardContent>
    </Card>
  );
}

type PresetPricePublishCardProps = {
  description: string;
  priceDefault?: number;
  priceHint?: string;
  publishLabel: string;
  publishHint: string;
  isPublishedDefault?: boolean;
};

export function PresetPricePublishCard({
  description,
  priceDefault = 0,
  priceHint,
  publishLabel,
  publishHint,
  isPublishedDefault = false,
}: PresetPricePublishCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 및 공개 설정</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="price" className="text-sm font-medium">
            가격 (크레딧)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={priceDefault}
          />
          {priceHint && (
            <p className="text-xs text-muted-foreground">{priceHint}</p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked={isPublishedDefault}
            className="mt-1 size-4 rounded border border-input"
          />
          <div className="space-y-1">
            <label htmlFor="isPublished" className="text-sm font-medium">
              {publishLabel}
            </label>
            <p className="text-xs text-muted-foreground">{publishHint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
