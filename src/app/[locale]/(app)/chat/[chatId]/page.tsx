import { ChatHeader } from "@/app/[locale]/(app)/chat/_components/chat-header";
import { getChatById, getChatMessagesByChatId } from "@/db/query/chat";
import { getOwnedWorkflowChatCreditEstimate } from "@/db/query/workflow-credits";
import { getOwnedWorkflowById } from "@/features/workflows/server/queries";
import { ChatEventWrapper } from "@/features/chat/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";

export default async function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[chatId]">) {
  const { chatId } = await params;
  const chat = await getChatById(chatId);
  const workflow = await getOwnedWorkflowById(chat.workflowId);
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
