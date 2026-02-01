import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/utils";

type PresetsListVariant = "market" | "library";

export type PresetListItem = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  price: number;
  updatedAt?: Date | string | null;
  ownerName?: string | null;
  purchaseCount?: number | null;
  isPurchased?: boolean | null;
};

type PresetsListProps = {
  items: PresetListItem[];
  variant?: PresetsListVariant;
};

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatKoreanDate(value, "날짜 없음");

const resolveActionState = (
  preset: PresetListItem,
  variant: PresetsListVariant,
) => {
  const isOwned = variant === "library" ? true : Boolean(preset.isPurchased);
  const isFree = preset.price === 0;

  const actionLabel = isOwned
    ? "이미 보유함"
    : isFree
      ? "무료로 받기"
      : "구매하기";
  const actionVariant: "default" | "secondary" =
    isOwned || isFree ? "secondary" : "default";

  return { actionLabel, actionVariant, isOwned };
};

export function PresetsCard({
  preset,
  variant = "market",
}: {
  preset: PresetListItem;
  variant?: PresetsListVariant;
}) {
  const { actionLabel, actionVariant, isOwned } = resolveActionState(
    preset,
    variant,
  );
  const showPurchaseCount = typeof preset.purchaseCount === "number";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {preset.category ?? "미분류"}
          </span>
          <span>업데이트 {formatDate(preset.updatedAt)}</span>
        </div>
        <CardTitle className="text-lg">{preset.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {preset.summary ?? preset.description ?? "설명이 없습니다."}
        </CardDescription>
        <CardAction>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {formatPrice(preset.price)}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {showPurchaseCount ? <span>구매 {preset.purchaseCount}</span> : null}
          <span>제작자 {preset.ownerName ?? "알 수 없음"}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-t">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/presets/${preset.id}`}>상세 보기</Link>
        </Button>
        <Button
          size="sm"
          variant={actionVariant}
          className="flex-1"
          disabled={isOwned}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PresetsList({ items, variant = "market" }: PresetsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((preset) => (
        <PresetsCard key={preset.id} preset={preset} variant={variant} />
      ))}
    </div>
  );
}
