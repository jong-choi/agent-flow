import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageHeading } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type ChatPageWorkflow } from "@/features/chats/components/chat-page/chat-queries";
import { ChatSidebar } from "@/features/chats/components/chat-page/chat-sidebar";
import { ChatWorkflowCard } from "@/features/chats/components/chat-page/chat-workflow-card";
import { ChatWorkflowListDialog } from "@/features/chats/components/chat-page/chat-workflow-list-dialog";
import { getRecentWorkflowsForChat } from "@/features/chats/server/queries";

export default function Page() {
  return (
    <PageContainer
      LeftPanel={<ChatSidebar />}
      className="max-w-full"
      withoutRightPanel
    >
      <div className="flex h-full flex-col items-center justify-center gap-16 pb-32">
        <PageHeading>워크플로우를 선택하여 채팅을 시작하세요.</PageHeading>
        <Suspense fallback={<ChatWorkflowSectionFallback />}>
          <ChatWorkflowSection />
        </Suspense>
      </div>
    </PageContainer>
  );
}

async function ChatWorkflowSection() {
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
            저장된 워크플로우가 없습니다.
          </div>
          <Button asChild>
            <Link href="/workflows/canvas">워크플로우 생성하기</Link>
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
