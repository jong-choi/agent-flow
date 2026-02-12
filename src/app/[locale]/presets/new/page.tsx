import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowListCard } from "@/features/workflows/components/workflow-list-card";
import { getOwnedWorkflows } from "@/features/workflows/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale, withMetadataSuffix } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/presets/new">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });
  const title = t("meta.createTitle");

  return {
    title: withMetadataSuffix(title, "NEW"),
  };
}

export default async function PresetCreatePage({
  params,
}: PageProps<"/[locale]/presets/new">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Presets",
  });

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("newPage.stepLabel")}
            </p>
            <h1 className="text-2xl font-semibold">{t("newPage.heading")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("newPage.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets">{t("newPage.marketButton")}</Link>
            </Button>
            <Button asChild>
              <Link href="/presets/purchased">
                {t("newPage.myPresetsButton")}
              </Link>
            </Button>
          </div>
        </div>
        <Suspense fallback={<PresetCreateWorkflowListFallback />}>
          <PresetCreateWorkflowList />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function PresetCreateWorkflowList() {
  const t = await getTranslations<AppMessageKeys>("Presets");
  const workflowList = await getOwnedWorkflows();

  if (workflowList.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>{t("newPage.emptyWorkflowTitle")}</CardTitle>
          <CardDescription>
            {t("newPage.emptyWorkflowDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" asChild>
            <Link href="/workflows/canvas">{t("newPage.createWorkflow")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workflowList.map((workflow) => (
        <WorkflowListCard
          key={workflow.id}
          href={`/presets/new/${workflow.id}`}
          workflowId={workflow.id}
          title={workflow.title}
          description={workflow.description}
          updatedAt={workflow.updatedAt}
          actionLabel={t("newPage.selectWorkflow")}
        />
      ))}
    </div>
  );
}

function PresetCreateWorkflowListFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
