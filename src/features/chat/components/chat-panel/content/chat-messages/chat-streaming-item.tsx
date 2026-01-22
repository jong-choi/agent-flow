import { useShallow } from "zustand/react/shallow";
import { ChatMessageItem } from "@/features/chat/components/chat-panel/content/chat-messages/chat-message-item";
import { useChatStore } from "@/features/chat/store/chat-store";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";

export function ChatStreamingItem({ nodeId }: { nodeId: string }) {
  const streamingChunkMapContent = useChatStore(
    useShallow((s) => s.streamingChunkMap[nodeId]),
  );
  const message: ClientChatMessage = {
    id: nodeId,
    role: "assistant",
    content: streamingChunkMapContent,
    createdAt: null,
  };

  return <ChatMessageItem key={message.id} message={message} />;
}
