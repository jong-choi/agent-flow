import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { PresetCreateForm } from "@/features/presets/components/preset-create-form";
import { createPresetAction } from "@/features/presets/server/actions";
import { getOwnedWorkflowById } from "@/features/workflows/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import {
  resolveMetadataLocale,
  resolveMetadataTitle,
  withMetadataSuffix,
} from "@/lib/metadata";
import { formatYMD } from "@/lib/utils";

const presetCreateFallbackTitles = {
  ko: "프리셋 만들기",
  en: "Create Preset",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets/new/[workflowId]">): Promise<Metadata> {
  const { locale: requestedLocale, workflowId } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const fallbackTitle = withMetadataSuffix(t("meta.createTitle"), "PRESET");

  try {
    const workflow = await getOwnedWorkflowById(workflowId);

    return {
      title: withMetadataSuffix(
        resolveMetadataTitle({
          title: workflow?.title,
          locale,
          localizedFallbacks: presetCreateFallbackTitles,
        }),
        "PRESET",
      ),
    };
  } catch {
    return { title: fallbackTitle };
  }
}

export default function PresetCreateDetailPage({
  params,
}: PageProps<"/[locale]/presets/new/[workflowId]">) {
  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <FadeSuspense fallback={<PresetCreateDetailHeaderFallback />}>
          <PresetCreateDetailHeader paramsPromise={params} />
        </FadeSuspense>
        <FadeSuspense fallback={<PresetCreateDetailFallback />}>
          <PresetCreateDetailContent paramsPromise={params} />
        </FadeSuspense>
      </div>
    </PageContainer>
  );
}

async function PresetCreateDetailHeader({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/presets/new/[workflowId]">["params"];
}) {
  const { locale } = await paramsPromise;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {t("newDetailPage.stepLabel")}
        </p>
        <h1 className="text-2xl font-semibold">{t("newDetailPage.heading")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("newDetailPage.description")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/presets">{t("newDetailPage.marketButton")}</Link>
        </Button>
        <Button asChild>
          <Link href="/presets/purchased">
            {t("newDetailPage.myPresetsButton")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

async function PresetCreateDetailContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/presets/new/[workflowId]">["params"];
}) {
  const { workflowId, locale } = await paramsPromise;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const workflow = await getOwnedWorkflowById(workflowId);

  if (!workflow) {
    notFound();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("newDetailPage.selectedWorkflowTitle")}</CardTitle>
          <CardDescription>
            {t("newDetailPage.selectedWorkflowDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{workflow.title}</p>
            <p className="text-xs text-muted-foreground">
              {workflow.description ?? t("common.noDescription")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("newDetailPage.updatedAt", {
                date: formatYMD(workflow.updatedAt),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/presets/new">
                {t("newDetailPage.changeWorkflow")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workflows/${workflow.id}`}>
                {t("newDetailPage.viewWorkflow")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PresetCreateForm
        locale={locale}
        action={createPresetAction}
        workflowId={workflow.id}
        cancelHref="/presets/new"
      />
    </>
  );
}

function PresetCreateDetailFallback() {
  return (
    <>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function PresetCreateDetailHeaderFallback() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
