import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useChatEvent } from "@/features/chat/hooks/use-chat-event";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatPanelInputForm() {
  const isComposingRef = useRef<boolean>(false);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendMessage = useChatEvent();
  const [isMessage, setIsMessage] = useState<boolean>(false);
  const isSendingAvailable = !isStreaming && isMessage;

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSendingAvailable || !textareaRef.current) {
      return;
    }

    const message = textareaRef.current.value.trim();
    if (!message) {
      return;
    }

    sendMessage(message);
    textareaRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <Textarea
        ref={textareaRef}
        onChange={(event) => setIsMessage(Boolean(event.target.value.trim()))}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요..."
        className="h-24"
        disabled={isStreaming}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {isStreaming ? <Spinner className="size-4" /> : "대기 중"}
        </span>
        <Button
          type="submit"
          className="self-end-safe"
          disabled={!isSendingAvailable}
        >
          전송
        </Button>
      </div>
    </form>
  );
}
