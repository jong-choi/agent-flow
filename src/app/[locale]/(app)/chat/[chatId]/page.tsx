import { ChatEventWrapper } from "@/features/chat/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";

export default async function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[chatId]">) {
  const { chatId } = await params;
  return (
    <ChatEventWrapper initialThreadId={chatId}>
      <ChatPanelContent />
    </ChatEventWrapper>
  );
}
