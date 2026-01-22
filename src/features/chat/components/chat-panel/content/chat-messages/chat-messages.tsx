import { useShallow } from "zustand/react/shallow";
import { ChatMessageItem } from "@/features/chat/components/chat-panel/content/chat-messages/chat-message-item";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatMessages() {
  const messages = useChatStore(useShallow((s) => s.messages));

  return (
    <>
      {messages.map((message) => {
        return <ChatMessageItem key={message.id} message={message} />;
      })}
    </>
  );
}
