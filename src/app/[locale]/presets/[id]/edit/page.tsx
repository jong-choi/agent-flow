import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresetEditForm } from "@/features/presets/components/preset-edit-form";
import {
  deletePresetAction,
  updatePresetAction,
} from "@/features/presets/server/actions";
import { getOwnedPresetForEdit } from "@/features/presets/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import {
  resolveMetadataLocale,
  resolveMetadataTitle,
  withMetadataSuffix,
} from "@/lib/metadata";

const presetFallbackTitles = {
  ko: "프리셋",
  en: "Presets",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets/[id]/edit">): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const fallbackTitle = withMetadataSuffix(
    t("meta.detailFallbackTitle"),
    "EDIT",
  );

  try {
    const preset = await getOwnedPresetForEdit(id);

    return {
      title: withMetadataSuffix(
        resolveMetadataTitle({
          title: preset?.title,
          locale,
          localizedFallbacks: presetFallbackTitles,
        }),
        "EDIT",
      ),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

export type PresetEditRes = NonNullable<
  Awaited<ReturnType<typeof getOwnedPresetForEdit>>
>;

export default async function PresetEditPage({
  params,
}: PageProps<"/[locale]/presets/[id]/edit">) {
  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <Suspense fallback={<PresetEditHeaderFallback />}>
          <PresetEditHeader paramsPromise={params} />
        </Suspense>
        <Suspense fallback={<PresetEditContentFallback />}>
          <PresetEditContent paramsPromise={params} />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function PresetEditHeader({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/presets/[id]/edit">["params"];
}) {
  const { locale } = await paramsPromise;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{t("editPage.sectionLabel")}</p>
      <h1 className="text-2xl font-semibold">{t("editPage.heading")}</h1>
      <p className="text-sm text-muted-foreground">{t("editPage.description")}</p>
    </div>
  );
}

async function PresetEditContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/presets/[id]/edit">["params"];
}) {
  const t = await getTranslations<AppMessageKeys>("Presets");
  const { id } = await paramsPromise;
  const preset = await getOwnedPresetForEdit(id);

  if (!preset) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/presets/${preset.id}`}>
              {t("editPage.detailButton")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/presets">{t("editPage.marketButton")}</Link>
          </Button>
        </div>
      </div>

      <PresetEditForm
        preset={preset}
        updateAction={updatePresetAction}
        deleteAction={deletePresetAction}
      />
    </>
  );
}

function PresetEditContentFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function PresetEditHeaderFallback() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}
