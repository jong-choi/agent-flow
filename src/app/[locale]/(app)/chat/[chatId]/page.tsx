import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatHeader } from "@/features/chats/components/chat-page/chat-header";
import { getOwnedWorkflowChatCreditEstimate } from "@/db/query/workflow-credits";
import { ChatEventWrapper } from "@/features/chats/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chats/components/chat-panel/content/chat-panel-content";
import {
  getChatById,
  getChatMessagesByChatId,
  getOwnedWorkflowForChatById,
} from "@/features/chats/server/queries";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";

export default function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[chatId]">) {
  return (
    <Suspense fallback={<ChatRunPageFallback />}>
      <ChatRunContent paramsPromise={params} />
    </Suspense>
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
    <div className="flex h-full min-h-0 w-full flex-col">
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
    </div>
  );
}

function ChatRunPageFallback() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="border-b px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="container mx-auto flex min-h-0 max-w-5xl flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-4/5" />
            <Skeleton className="ml-auto h-20 w-3/5" />
            <Skeleton className="h-20 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
