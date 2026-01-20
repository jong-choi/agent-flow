import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatPanelMessages() {
  const messages = useChatStore(useShallow((s) => s.messages));

  return (
    <div>
      {messages.map((message) => {
        return <div key={message.id}>{String(message.content)}</div>;
      })}
    </div>
  );
}
