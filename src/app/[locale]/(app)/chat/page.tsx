import Link from "next/link";
import { ChatWorkflowCard } from "@/features/chats/components/chat-page/chat-workflow-card";
import { ChatWorkflowListDialog } from "@/features/chats/components/chat-page/chat-workflow-list-dialog";
import { type ChatPageWorkflow } from "@/features/chats/components/chat-page/chat-queries";
import { PageHeading } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { getRecentWorkflowsForChat } from "@/features/chats/server/queries";

export default async function Page() {
  const { data, hasMore } = await getRecentWorkflowsForChat();

  return (
    <div className="container mx-auto">
      <div className="flex h-full flex-col items-center justify-center gap-16 pb-32">
        <PageHeading>워크플로우를 선택하여 채팅을 시작하세요.</PageHeading>
        {data.length && (
          <div className="flex w-3/5 min-w-[450px] flex-col gap-8">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {data.map((workflow: ChatPageWorkflow) => {
                return (
                  <ChatWorkflowCard key={workflow.id} workflow={workflow} />
                );
              })}
            </div>
          </div>
        )}
        {hasMore && <ChatWorkflowListDialog />}
        {!data.length && (
          <>
            <div className="font-semibold text-muted-foreground">
              저장된 워크플로우가 없습니다.
            </div>
            <Button asChild>
              <Link href="/workflows/canvas">워크플로우 생성하기</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
