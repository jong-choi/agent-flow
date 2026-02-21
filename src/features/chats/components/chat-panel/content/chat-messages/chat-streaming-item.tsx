import { useMemo } from "react";
import { ChatMessageItem } from "@/features/chats/components/chat-panel/content/chat-messages/chat-message-item";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";

export function ChatStreamingItem({ nodeId }: { nodeId: string }) {
  const message: ClientChatMessage = useMemo(
    () => ({
      id: nodeId,
      role: "assistant",
      content: "",
      createdAt: null,
    }),
    [nodeId],
  );
  return <ChatMessageItem message={message} />;
}
