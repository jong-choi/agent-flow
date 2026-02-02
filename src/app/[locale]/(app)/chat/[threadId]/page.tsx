import { ChatEventWrapper } from "@/features/chat/components/chat-panel/chat-event-wrapper";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";

export default async function ChatRunPage({
  params,
}: PageProps<"/[locale]/chat/[threadId]">) {
  const { threadId } = await params;
  return (
    <ChatEventWrapper initialThreadId={threadId}>
      <ChatPanelContent />
    </ChatEventWrapper>
  );
}
