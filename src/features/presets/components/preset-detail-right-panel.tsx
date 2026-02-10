import Link from "next/link";
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
import { formatYMD } from "@/lib/utils";

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

type PresetDetailRightPanelProps = {
  presetId: string;
};

export async function PresetDetailRightPanel({
  presetId,
}: PresetDetailRightPanelProps) {
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
          <CardTitle>가격 및 구매</CardTitle>
          <CardDescription>프리셋은 크레딧으로 결제합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-3xl font-semibold">
              {formatPrice(preset.totalPrice)}
            </p>
            <p className="text-xs text-muted-foreground">
              구매 {preset.purchaseCount} · 업데이트{" "}
              {formatDate(preset.updatedAt)}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">제작자</span>
              <span className="font-medium">
                {preset.ownerDisplayName ?? "알 수 없음"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">노드</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">엣지</span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 border-t">
          {canOpen ? (
            <>
              {isOwner ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/presets/${preset.id}/edit`}>프리셋 수정</Link>
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
          <CardTitle>제작자</CardTitle>
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
                {preset.ownerDisplayName ?? "알 수 없음"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프리셋 정보</CardTitle>
          <CardDescription>워크플로우 구성 요약</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">노드</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">엣지</span>
            <span className="font-medium">{edges.length}</span>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">생성</span>
              <span className="font-medium">
                {formatDate(preset.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">최근 업데이트</span>
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
