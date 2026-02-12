import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { resolvePresetCategoryKey } from "@/features/presets/constants/category-options";
import { type AppMessageKeys } from "@/lib/i18n/messages";
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
  locale: string;
  variant?: PresetsListVariant;
};

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

type PresetsTranslator = Awaited<
  ReturnType<typeof getTranslations<AppMessageKeys>>
>;

const formatPrice = (t: PresetsTranslator, price: number) =>
  price === 0 ? t("common.free") : t("common.priceCredits", { count: price });

const resolveCategoryLabel = (
  t: PresetsTranslator,
  category: string | null | undefined,
) => {
  if (!category) {
    return t("common.uncategorized");
  }

  const key = resolvePresetCategoryKey(category);
  return key ? t(`categories.${key}`) : category;
};

function PresetsCard({
  preset,
  variant = "market",
  t,
}: {
  preset: PresetListItem;
  variant?: PresetsListVariant;
  t: PresetsTranslator;
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
            {resolveCategoryLabel(t, preset.category)}
          </span>
          <span>
            {t("list.updatedAt", { date: formatDate(preset.updatedAt) })}
          </span>
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
              {preset.summary ?? t("common.noDescription")}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {formatPrice(t, preset.totalPrice)}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {showPurchaseCount ? (
            <span>
              {t("list.purchaseCount", { count: preset.purchaseCount ?? 0 })}
            </span>
          ) : null}
          <span>
            {t("list.creator", {
              name: preset.ownerDisplayName ?? t("common.unknownOwner"),
            })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-t">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/presets/${preset.id}`}>{t("list.detailButton")}</Link>
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

export async function PresetsList({
  items,
  locale,
  variant = "market",
}: PresetsListProps) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((preset) => (
        <PresetsCard key={preset.id} preset={preset} variant={variant} t={t} />
      ))}
    </div>
  );
}
