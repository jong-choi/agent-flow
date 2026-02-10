import Link from "next/link";
import { BoringCardAvatar } from "@/components/boring-avatar";
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
import { PresetPurchaseDialog } from "@/features/presets/components/preset-purchase-dialog";
import { formatYMD } from "@/lib/utils";

type PresetsListVariant = "market" | "library";

export type PresetListItem = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  price: number;
  referencedPresetPrice: number;
  totalPrice: number;
  updatedAt?: Date | string | null;
  ownerDisplayName?: string | null;
  ownerAvatarHash?: string | null;
  purchaseCount?: number | null;
  isPurchased?: boolean | null;
  isOwner?: boolean | null;
};

type PresetsListProps = {
  items: PresetListItem[];
  variant?: PresetsListVariant;
};

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

export function PresetsCard({
  preset,
  variant = "market",
}: {
  preset: PresetListItem;
  variant?: PresetsListVariant;
}) {
  const isOwned =
    variant === "library"
      ? true
      : Boolean(preset.isPurchased || preset.isOwner);
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
        <div className="flex items-center gap-3">
          <BoringCardAvatar
            seed={preset.id}
            size={40}
            square={false}
            className="size-10"
          />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{preset.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {preset.summary ?? "설명이 없습니다."}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {formatPrice(preset.totalPrice)}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {showPurchaseCount ? <span>구매 {preset.purchaseCount}</span> : null}
          <span>제작자 {preset.ownerDisplayName ?? "알 수 없음"}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-t">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/presets/${preset.id}`}>상세 보기</Link>
        </Button>
        <PresetPurchaseDialog
          presetId={preset.id}
          totalPrice={preset.totalPrice}
          currentPresetPrice={preset.price}
          referencedPresetPrice={preset.referencedPresetPrice}
          isOwned={isOwned}
          size="sm"
          className="flex-1"
        />
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
