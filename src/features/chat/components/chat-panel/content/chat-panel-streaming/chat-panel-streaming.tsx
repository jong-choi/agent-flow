import { useShallow } from "zustand/react/shallow";
import { ChatPanelStreamingContent } from "@/features/chat/components/chat-panel/content/chat-panel-streaming/chat-panel-streaming-content";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatPanelStreaming() {
  const streamingChunkKeys = useChatStore(
    useShallow((s) => Object.keys(s.streamingChunkMap)),
  );

  return (
    <div>
      {streamingChunkKeys.map((key) => {
        return <ChatPanelStreamingContent key={key} nodeId={key} />;
      })}
    </div>
  );
}
