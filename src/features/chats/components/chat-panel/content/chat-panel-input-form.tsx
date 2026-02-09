import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNodes } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { useChatEvent } from "@/features/chats/hooks/use-chat-event";
import { useChatStore } from "@/features/chats/store/chat-store";

export function ChatPanelInputForm() {
  const isComposingRef = useRef<boolean>(false);
  const mode = useChatStore((s) => s.mode);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendMessage = useChatEvent();
  const [draft, setDraft] = useState("");
  const isMessage = Boolean(draft.trim());
  const isSendingAvailable = !isStreaming && isMessage;

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleSubmit = async () => {
    if (!isSendingAvailable) {
      return;
    }

    const message = draft.trim();
    if (!message) {
      return;
    }

    setDraft("");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    try {
      await sendMessage(message);
    } catch (error) {
      setDraft((prev) => prev || message);
      toast.error(
        error instanceof Error ? error.message : "응답을 받을 수 없습니다.",
      );
    } finally {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      if (!isSendingAvailable) {
        return;
      }
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleFormSubmit}>
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요..."
        className="h-24"
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {isStreaming ? <Spinner className="size-4" /> : "대기 중"}
        </span>

        <div className="flex flex-col justify-end">
          <Button
            type="submit"
            className="self-end-safe"
            disabled={!isSendingAvailable}
          >
            전송
          </Button>
          {mode === "temporary" ? (
            <TemporaryWorkflowCreditEstimate />
          ) : (
            <PersistentWorkflowCreditEstimate />
          )}
        </div>
      </div>
    </form>
  );
}

function TemporaryWorkflowCreditEstimate() {
  const nodes = useNodes<FlowCanvasNode>();

  const { hasChatNode, estimatedCredits } = useMemo(() => {
    const chatNodes = nodes.filter((node) => node.type === "chatNode");

    const estimatedCreditsValue = chatNodes.reduce((sum, node) => {
      const modelId = node.data.content?.value;
      if (typeof modelId !== "string") return sum;

      const option = node.data.content?.options?.find(
        (item) => item.value === modelId,
      );
      const price = typeof option?.price === "number" ? option.price : 0;
      return sum + Math.max(0, price);
    }, 0);

    return {
      hasChatNode: chatNodes.length > 0,
      estimatedCredits: estimatedCreditsValue,
    };
  }, [nodes]);

  if (!hasChatNode) return null;

  return (
    <span className="text-end text-[10px] text-muted-foreground">
      {estimatedCredits} 크레딧
    </span>
  );
}

function PersistentWorkflowCreditEstimate() {
  const estimatedCredits = useChatStore((s) => s.estimatedCredits);
  if (estimatedCredits == null) return null;

  return (
    <span className="text-end text-[10px] text-muted-foreground">
      {estimatedCredits} 크레딧
    </span>
  );
}
