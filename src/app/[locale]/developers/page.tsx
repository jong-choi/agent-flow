import { type ReactNode, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiGuideMarkdown } from "@/features/developers/components/api-guide-markdown";
import { SecretKeysManager } from "@/features/developers/components/secret-keys-manager";
import { getUserSecrets } from "@/features/developers/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/developers">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });

  return {
    title: t("meta.developerApiTitle"),
  };
}

export default async function DevelopersPage({
  params,
}: PageProps<"/[locale]/developers">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Developers",
  });

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>{t("indexPage.heading")}</PageHeading>
            <PageDescription>{t("indexPage.description")}</PageDescription>
          </PageHeader>
          <Button asChild variant="secondary">
            <Link href="/developers/apis">
              {t("indexPage.workflowApiButton")}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("indexPage.secretCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t.rich("indexPage.secretCardDescription", {
                code: (chunks) => <code>{chunks}</code>,
              })}
            </p>
            <Suspense fallback={<SecretKeysManagerFallback />}>
              <SecretKeysManagerServer />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("indexPage.guidesCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <GuideCollapsible
              title={t("indexPage.openAiGuideTitle")}
              description={t("indexPage.openAiGuideDescription")}
            >
              <Suspense fallback={<ApiGuideMarkdownFallback />}>
                <ApiGuideMarkdown
                  locale={locale}
                  docName="openai-compat-guide"
                />
              </Suspense>
            </GuideCollapsible>

            <GuideCollapsible
              title={t("indexPage.agentflowGuideTitle")}
              description={t("indexPage.agentflowGuideDescription")}
            >
              <Suspense fallback={<ApiGuideMarkdownFallback />}>
                <ApiGuideMarkdown locale={locale} docName="api-guide" />
              </Suspense>
            </GuideCollapsible>
          </CardContent>
        </Card>
      </PageStack>
    </PageContainer>
  );
}

async function SecretKeysManagerServer() {
  const secrets = await getUserSecrets();
  return <SecretKeysManager initialSecrets={secrets} />;
}

function SecretKeysManagerFallback() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="h-56 rounded-md bg-accent/40 p-2">
        <div className="space-y-2">
          <Skeleton className="h-[52px] rounded-md border bg-background" />
          <Skeleton className="h-[52px] rounded-md border bg-background" />
          <Skeleton className="h-[52px] rounded-md border bg-background" />
        </div>
      </div>
    </div>
  );
}

function ApiGuideMarkdownFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}

function GuideCollapsible({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Collapsible
      className="rounded-lg border border-border/60"
      defaultOpen={false}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
        <div className="space-y-0.5">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/60 px-4 py-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
