import { Suspense } from "react";
import { PageContainer } from "@/components/page-template";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatHeader } from "@/features/chats/components/chat-page/chat-header";
import { ChatSidebar } from "@/features/chats/components/chat-page/chat-sidebar";
import { ChatEventWrapper } from "@/features/chats/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chats/components/chat-panel/content/chat-panel-content";
import {
  getChatById,
  getChatMessagesByChatId,
  getOwnedWorkflowForChatById,
} from "@/features/chats/server/queries";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { getOwnedWorkflowChatCreditEstimate } from "@/features/workflows/server/queries";

export default function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[chatId]">) {
  return (
    <PageContainer
      className="flex h-[calc(100dvh-3.5rem)] max-w-full flex-col py-4"
      LeftPanel={<ChatSidebar />}
      withoutRightPanel
    >
      <Suspense fallback={<ChatRunPageFallback />}>
        <ChatRunContent paramsPromise={params} />
      </Suspense>
    </PageContainer>
  );
}

async function ChatRunContent({
  paramsPromise,
}: {
  paramsPromise: PageProps<"/[locale]/chat/[chatId]">["params"];
}) {
  const { chatId } = await paramsPromise;
  const chat = await getChatById(chatId);
  const workflow = await getOwnedWorkflowForChatById(chat.workflowId);
  const estimatedCredits = await getOwnedWorkflowChatCreditEstimate(
    chat.workflowId,
  );

  const messages = await getChatMessagesByChatId(chatId);
  const initialMessages: ClientChatMessage[] = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
      createdAt: message.createdAt ? message.createdAt.toISOString() : null,
    }));

  return (
    <>
      <ChatHeader
        chatId={chatId}
        chatTitle={chat.title}
        createdAt={chat.createdAt}
        workflowTitle={workflow?.title}
        workflowId={chat.workflowId}
      />
      <div className="container mx-auto flex min-h-0 max-w-5xl flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ChatEventWrapper
            mode="persistent"
            initialChatId={chatId}
            initialMessages={initialMessages}
            estimatedCredits={estimatedCredits}
          >
            <ChatPanelContent />
          </ChatEventWrapper>
        </div>
      </div>
    </>
  );
}

function ChatRunPageFallback() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="px-4 py-3">
        <div className="flex justify-between space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="container mx-auto flex min-h-0 max-w-5xl flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-col gap-5 space-y-4 p-4">
            <Skeleton className="ml-auto h-16 w-1/5" />
            <Skeleton className="h-32" />
            <Skeleton className="ml-auto h-16 w-3/5" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
