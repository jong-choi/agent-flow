import { useShallow } from "zustand/react/shallow";
import { ChatStreamingItem } from "@/features/chat/components/chat-panel/content/chat-messages/chat-streaming-item";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatStreamingMessages() {
  const streamingChunkKeys = useChatStore(
    useShallow((s) => Object.keys(s.streamingChunkMap)),
  );
  const isStreaming = useChatStore((s) => s.isStreaming);
  const lastMessageHeight = useChatStore((s) => s.lastMessageHeight);

  if (!isStreaming) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: `${lastMessageHeight}px`,
      }}
    >
      {streamingChunkKeys.map((key) => {
        return <ChatStreamingItem key={key} nodeId={key} />;
      })}
    </div>
  );
}
