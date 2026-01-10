import { CanvasChatPanelContainer } from "@/features/canvas/components/chat/canvas-chat-panel/canvas-chat-panel-container";
import { CanvasChatPanelContent } from "@/features/canvas/components/chat/canvas-chat-panel/canvas-chat-panel-content";

export default async function ChatPanel({
  searchParams,
}: {
  searchParams: Promise<{ chat_id?: string }>;
}) {
  const { chat_id: chatId } = await searchParams;
  const isRunning = Boolean(chatId);

  if (!isRunning) {
    return null;
  }

  return (
    <CanvasChatPanelContainer>
      <CanvasChatPanelContent />
    </CanvasChatPanelContainer>
  );
}
