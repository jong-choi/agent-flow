import { getChatMessagesByChatId } from "@/db/query/chat";
import { ChatEventWrapper } from "@/features/chat/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";

export default async function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[chatId]">) {
  const { chatId } = await params;
  let initialMessages: ClientChatMessage[] = [];

  try {
    const messages = await getChatMessagesByChatId(chatId);
    initialMessages = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        id: message.id,
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
        createdAt: message.createdAt ? message.createdAt.toISOString() : null,
      }));
  } catch (error) {
    throw error;
  }

  return (
    <ChatEventWrapper
      mode="persistent"
      initialChatId={chatId}
      initialMessages={initialMessages}
    >
      <ChatPanelContent />
    </ChatEventWrapper>
  );
}
