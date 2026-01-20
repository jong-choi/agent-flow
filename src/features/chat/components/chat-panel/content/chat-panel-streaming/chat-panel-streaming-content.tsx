import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatPanelStreamingContent({ nodeId }: { nodeId: string }) {
  const streamingChunkMapContent = useChatStore(
    useShallow((s) => s.streamingChunkMap[nodeId]),
  );

  return <div>{streamingChunkMapContent}</div>;
}
