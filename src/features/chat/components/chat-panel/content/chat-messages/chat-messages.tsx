import { useShallow } from "zustand/react/shallow";
import { ChatMessageItem } from "@/features/chat/components/chat-panel/content/chat-messages/chat-message-item";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatMessages() {
  const messages = useChatStore(useShallow((s) => s.messages));
  const lastMessageHeight = useChatStore((s) => s.lastMessageHeight);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const messagesLength = messages.length;

  return (
    <>
      {messages.map((message, index) => {
        // 마지막 메시지에 추가 높이 지정
        const isLastMessage = index === messagesLength - 1;

        const minHeight =
          isLastMessage && !isStreaming && lastMessageHeight
            ? `${lastMessageHeight}px`
            : "auto";

        return (
          <div key={message.id} style={{ minHeight }}>
            <ChatMessageItem message={message} />
          </div>
        );
      })}
    </>
  );
}
