import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowApiList } from "@/features/developers/components/apis/workflow-api-list";
import { getOwnedWorkflows } from "@/features/workflows/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/developers/apis">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });

  return {
    title: t("meta.workflowApiTitle"),
  };
}

export default async function DevelopersApisPage({
  params,
}: PageProps<"/[locale]/developers/apis">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });
  const baseUrl = process.env.BASE_URL || "";

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>{t("apisPage.heading")}</PageHeading>
            <PageDescription>
              {t.rich("apisPage.description", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </PageDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href="/developers">{t("apisPage.serviceKeysButton")}</Link>
          </Button>
        </div>

        <Suspense fallback={<WorkflowApiListFallback />}>
          <WorkflowApiListServer baseUrl={baseUrl} />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

async function WorkflowApiListServer({ baseUrl }: { baseUrl: string }) {
  const workflows = await getOwnedWorkflows();
  return <WorkflowApiList workflows={workflows} baseUrl={baseUrl} />;
}

function WorkflowApiListFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border/60 bg-background p-4"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="mt-2 flex items-end justify-between">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
