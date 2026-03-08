import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeading } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatWorkflowCard } from "@/features/chats/components/chat-page/chat-workflow-card";
import { ChatWorkflowListDialog } from "@/features/chats/components/chat-page/chat-workflow-list-dialog";
import { getRecentWorkflowsForChat } from "@/features/chats/server/queries";
import { type ChatPageWorkflow } from "@/features/chats/types/chat-page-list";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/chat">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });

  return {
    title: t("meta.chatTitle"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/chat">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });

  return (
    <PageContainer className="max-w-full" withoutLeftPanel withoutRightPanel>
      <div className="flex h-full flex-col items-center justify-center gap-16 pb-32">
        <PageHeading>{t("page.heading")}</PageHeading>
        <FadeSuspense fallback={<ChatWorkflowSectionFallback />}>
          <ChatWorkflowSection locale={locale} />
        </FadeSuspense>
      </div>
    </PageContainer>
  );
}

async function ChatWorkflowSection({ locale }: { locale: string }) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });
  const { data, hasMore } = await getRecentWorkflowsForChat();

  return (
    <>
      {data.length > 0 ? (
        <div className="flex w-3/5 min-w-[450px] flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {data.map((workflow: ChatPageWorkflow) => {
              return <ChatWorkflowCard key={workflow.id} workflow={workflow} />;
            })}
          </div>
        </div>
      ) : null}
      {hasMore ? <ChatWorkflowListDialog /> : null}
      {data.length === 0 ? (
        <>
          <div className="font-semibold text-muted-foreground">
            {t("page.empty.noWorkflows")}
          </div>
          <Button asChild>
            <Link href="/workflows/canvas">
              {t("page.empty.createWorkflow")}
            </Link>
          </Button>
        </>
      ) : null}
    </>
  );
}

function ChatWorkflowSectionFallback() {
  return (
    <div className="flex w-3/5 min-w-[450px] flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border/60 p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-end justify-between">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
