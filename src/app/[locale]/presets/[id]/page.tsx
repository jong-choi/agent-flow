import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
import { CanvasPreview } from "@/features/canvas/components/cavas-preview/canvas-preview";
import { PresetDetailRightPanel } from "@/features/presets/components/preset-detail-right-panel";
import { resolvePresetCategoryKey } from "@/features/presets/constants/category-options";
import { getPresetDetail } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale, resolveMetadataTitle } from "@/lib/metadata";
import { formatYMD } from "@/lib/utils";

const formatPrice = (
  t: Awaited<ReturnType<typeof getTranslations<AppMessageKeys>>>,
  price: number,
) =>
  price === 0 ? t("common.free") : t("common.priceCredits", { count: price });

const formatDate = (value: Date | string | null | undefined) =>
  formatYMD(value);

const presetFallbackTitles = {
  ko: "프리셋",
  en: "Presets",
} as const;

const resolveCategoryLabel = (
  t: Awaited<ReturnType<typeof getTranslations<AppMessageKeys>>>,
  category: string | null | undefined,
) => {
  if (!category) {
    return t("common.uncategorized");
  }

  const key = resolvePresetCategoryKey(category);
  return key ? t(`categories.${key}`) : category;
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets/[id]">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const fallbackTitle = t("meta.detailFallbackTitle");

  try {
    const presetDetail = await getPresetDetail(id);

    return {
      title: resolveMetadataTitle({
        title: presetDetail?.preset.title,
        locale,
        localizedFallbacks: presetFallbackTitles,
      }),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

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
  const { id, locale } = await paramsPromise;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
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
            <PresetDetailRightPanel locale={locale} presetId={id} />
          </Suspense>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              {isOwner ? (
                <Button variant="outline" asChild>
                  <Link href="/presets/purchased">
                    {t("detailPage.myPresets")}
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/presets">{t("detailPage.backToMarket")}</Link>
                </Button>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t("detailPage.categoryPreset", {
                    category: resolveCategoryLabel(t, preset.category),
                  })}
                </p>
                <h1 className="text-2xl font-semibold">{preset.title}</h1>
                <p className="text-base text-muted-foreground">
                  {preset.summary ?? t("common.noDescription")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  {t("detailPage.purchaseCount", {
                    count: preset.purchaseCount ?? 0,
                  })}
                </span>
                <span>
                  {t("detailPage.updatedAt", {
                    date: formatDate(preset.updatedAt),
                  })}
                </span>
                {workflow?.title ? (
                  <span>
                    {t("detailPage.workflowLabel", { title: workflow.title })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("detailPage.previewTitle")}</CardTitle>
                <CardDescription>
                  {t("detailPage.previewDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <div className="flex aspect-video items-center justify-center rounded-lg border bg-background/70 text-sm text-muted-foreground">
                    {t("detailPage.previewPending")}
                  </div>
                ) : (
                  <CanvasPreview nodes={nodes} edges={edges} />
                )}
              </CardContent>
            </Card>

            <PresetChatExampleSection locale={locale} chatId={preset.chatId} />

            <Card>
              <CardHeader>
                <CardTitle>{t("detailPage.introTitle")}</CardTitle>
                <CardDescription>
                  {t("detailPage.introDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-[600px] rounded-lg border p-4">
                  <ContentMarkdown className="px-4 py-2 !text-sm !leading-relaxed">
                    {preset.description ?? t("common.noDescription")}
                  </ContentMarkdown>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-base font-medium">
                      {t("detailPage.infoCategoryLabel")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {resolveCategoryLabel(t, preset.category)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background/70 p-3">
                    <p className="text-base font-medium">
                      {t("detailPage.infoUpdatedAtLabel")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(preset.updatedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("detailPage.workflowConfigTitle")}</CardTitle>
                <CardDescription>
                  {t("detailPage.workflowConfigDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("detailPage.noNodes")}
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
                            {node.description ?? t("common.noDescription")}
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
                <CardTitle>{t("detailPage.referencedTitle")}</CardTitle>
                <CardDescription>
                  {t("detailPage.referencedDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referencedPresets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("detailPage.noReferenced")}
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
                              {t("detailPage.creatorLabel", {
                                name: usedPreset.ownerDisplayName,
                              })}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatPrice(t, usedPreset.price)}
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
