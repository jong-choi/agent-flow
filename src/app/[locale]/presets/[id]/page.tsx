import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PresetChatExampleSection } from "@/app/[locale]/presets/[id]/_components/preset-chat-example-section";
import { ContentMarkdown } from "@/components/markdown/content-markdown";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserId } from "@/features/auth/server/queries";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";
import { PresetDetailRightPanel } from "@/features/presets/components/preset-detail-right-panel";
import { getPresetDetail } from "@/features/presets/server/queries";
import { formatYMD } from "@/lib/utils";

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

export default function PresetDetailPage({
  params,
}: PageProps<"/[locale]/presets/[id]">) {
  return (
    <Suspense fallback={<PresetDetailPageFallback />}>
      <PresetDetailContent paramsPromise={params} />
    </Suspense>
  );
}

async function PresetDetailContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/presets/[id]">["params"];
}) {
  const viewerId = (await getUserId({ throwOnError: false })) || undefined;
  const { id } = await paramsPromise;
  const presetDetail = await getPresetDetail(id);

  if (!presetDetail) {
    notFound();
  }

  const { preset, nodes, edges, workflow, referencedPresets } = presetDetail;
  const isOwner = viewerId ? viewerId === preset.ownerId : false;

  return (
    <>
      <PageContainer
        RightPanel={
          <Suspense>
            <PresetDetailRightPanel presetId={id} />
          </Suspense>
        }
      >
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
                  {preset.summary ?? "설명이 없습니다."}
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

            <PresetChatExampleSection chatId={preset.chatId} />

            <Card>
              <CardHeader>
                <CardTitle>프리셋 소개</CardTitle>
                <CardDescription>주요 특징과 구성 요소</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-32 rounded-lg border bg-accent/50 p-4 text-sm leading-relaxed">
                  <ContentMarkdown>
                    {preset.description ?? "설명이 없습니다."}
                  </ContentMarkdown>
                </div>
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

            <Card>
              <CardHeader>
                <CardTitle>사용된 프리셋</CardTitle>
                <CardDescription>
                  이 프리셋에 포함된(참조된) 프리셋 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referencedPresets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    참조된 프리셋이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {referencedPresets.map((usedPreset) => (
                      <Link
                        key={usedPreset.id}
                        href={`/presets/${usedPreset.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg border bg-background/70 px-3 py-2 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {usedPreset.title}
                          </p>
                          {usedPreset.ownerDisplayName ? (
                            <p className="truncate text-xs text-muted-foreground">
                              제작자 {usedPreset.ownerDisplayName}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatPrice(usedPreset.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function PresetDetailPageFallback() {
  return (
    <>
      <PageContainer>
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
          <div className="space-y-3">
            <Skeleton className="h-9 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-video w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={`preset-detail-node-fallback-${index}`}
                    className="h-14 w-full rounded-lg"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
