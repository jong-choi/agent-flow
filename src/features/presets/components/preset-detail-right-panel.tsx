import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BoringUserAvatar } from "@/components/boring-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUserId } from "@/features/auth/server/queries";
import { PresetPurchaseDialog } from "@/features/presets/components/preset-purchase-dialog";
import {
  getPresetDetail,
  getPresetPurchaseStatus,
} from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { formatYMD } from "@/lib/utils";

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

type PresetDetailRightPanelProps = {
  presetId: string;
};

export async function PresetDetailRightPanel({
  presetId,
}: PresetDetailRightPanelProps) {
  const t = await getTranslations<AppMessageKeys>("Presets");
  const viewerId = (await getUserId({ throwOnError: false })) || undefined;
  const presetDetail = await getPresetDetail(presetId);

  if (!presetDetail) {
    return null;
  }

  const { preset, nodes, edges } = presetDetail;
  const isOwner = viewerId ? viewerId === preset.ownerId : false;
  const isPurchased =
    viewerId && !isOwner ? await getPresetPurchaseStatus(preset.id) : false;
  const canOpen = isOwner || isPurchased;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("rightPanel.pricePurchaseTitle")}</CardTitle>
          <CardDescription>{t("rightPanel.pricePurchaseDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-3xl font-semibold">
              {preset.totalPrice === 0
                ? t("common.free")
                : t("common.priceCredits", { count: preset.totalPrice })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("rightPanel.purchaseMeta", {
                count: preset.purchaseCount,
                date: formatDate(preset.updatedAt),
              })}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("rightPanel.creatorLabel")}
              </span>
              <span className="font-medium">
                {preset.ownerDisplayName ?? t("common.unknownOwner")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("rightPanel.nodesLabel")}
              </span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("rightPanel.edgesLabel")}
              </span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 border-t">
          {canOpen ? (
            <>
              {isOwner ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/presets/${preset.id}/edit`}>
                    {t("rightPanel.editPresetButton")}
                  </Link>
                </Button>
              ) : null}
            </>
          ) : (
            <PresetPurchaseDialog
              presetId={preset.id}
              totalPrice={preset.totalPrice}
              currentPresetPrice={preset.price}
              referencedPresetPrice={preset.referencedPresetPrice}
            />
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rightPanel.creatorCardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <BoringUserAvatar
              seed={preset.ownerAvatarHash ?? "default"}
              size={40}
              square={false}
              className="size-10"
            />
            <div>
              <p className="text-sm font-medium">
                {preset.ownerDisplayName ?? t("common.unknownOwner")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rightPanel.infoTitle")}</CardTitle>
          <CardDescription>{t("rightPanel.infoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("rightPanel.nodesLabel")}
            </span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("rightPanel.edgesLabel")}
            </span>
            <span className="font-medium">{edges.length}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("rightPanel.createdLabel")}
              </span>
              <span className="font-medium">
                {formatDate(preset.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("rightPanel.recentUpdatedLabel")}
              </span>
              <span className="font-medium">
                {formatDate(preset.updatedAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
