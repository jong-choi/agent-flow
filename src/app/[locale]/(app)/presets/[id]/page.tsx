import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/page-template";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getUserId } from "@/db/query/auth";
import { getPresetDetail, getPresetPurchaseStatus } from "@/db/query/presets";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";
import { PresetPurchaseDialog } from "@/features/preset/components/preset-purchase-dialog";
import { formatKoreanDate } from "@/lib/utils";

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatKoreanDate(value, "날짜 없음");

export default async function PresetDetailPage({
  params,
}: PageProps<"/[locale]/presets/[id]">) {
  const viewerId = (await getUserId({ throwOnError: false })) || undefined;

  const { id } = await params;
  const presetDetail = await getPresetDetail(id);

  if (!presetDetail) {
    notFound();
  }

  const { preset, nodes, edges, workflow } = presetDetail;
  const isOwner = viewerId ? viewerId === preset.ownerId : false;
  const isPurchased =
    viewerId && !isOwner ? await getPresetPurchaseStatus(preset.id) : false;
  const canOpen = isOwner || isPurchased;

  return (
    <>
      <PageContainer>
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              {isOwner ? (
                <Button variant="outline" asChild>
                  <Link href="/presets/purchased">내 프리셋</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/presets">마켓으로</Link>
                </Button>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {preset.category ?? "미분류"} 프리셋
                </p>
                <h1 className="text-2xl font-semibold">{preset.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {preset.description ?? "설명이 없습니다."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>구매 {preset.purchaseCount}</span>
                <span>업데이트 {formatDate(preset.updatedAt)}</span>
                {workflow?.title ? (
                  <span>워크플로우 {workflow.title}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>미리보기</CardTitle>
                <CardDescription>
                  캔버스에서 실행 흐름을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <div className="flex aspect-video items-center justify-center rounded-lg border bg-background/70 text-sm text-muted-foreground">
                    캔버스 미리보기 준비 중
                  </div>
                ) : (
                  <CanvasPreview nodes={nodes} edges={edges} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>프리셋 소개</CardTitle>
                <CardDescription>주요 특징과 구성 요소</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {preset.summary ?? preset.description ?? "설명이 없습니다."}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-sm font-medium">카테고리</p>
                    <p className="text-xs text-muted-foreground">
                      {preset.category ?? "미분류"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-sm font-medium">업데이트</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(preset.updatedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>워크플로우 구성</CardTitle>
                <CardDescription>
                  그래프에 포함된 노드를 확인합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    노드가 아직 없습니다.
                  </p>
                ) : (
                  <div className="scrollbar-slim max-h-80 space-y-3 overflow-auto pr-2">
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-start justify-between gap-4 rounded-lg border bg-background/70 px-3 py-2"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{node.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {node.description ?? "설명이 없습니다."}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {node.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
      <aside className="fixed top-20 right-10 w-full shrink-0 lg:w-72">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>가격 및 구매</CardTitle>
              <CardDescription>프리셋은 크레딧으로 결제합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-3xl font-semibold">
                  {formatPrice(preset.price)}
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
                    {preset.ownerName ?? "알 수 없음"}
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
                      <Link href={`/presets/${preset.id}/edit`}>
                        프리셋 수정
                      </Link>
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <PresetPurchaseDialog
                    presetId={preset.id}
                    price={preset.price}
                  />
                </>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>제작자</CardTitle>
              <CardDescription>프리셋을 만든 전문가</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>
                    {(preset.ownerName ?? "?").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {preset.ownerName ?? "알 수 없음"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {preset.category ?? "미분류"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                프로필 보기
              </Button>
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
      </aside>
    </>
  );
}
