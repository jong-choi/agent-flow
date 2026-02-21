import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useNodes } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { ChatStreamingStatus } from "@/features/chats/components/chat-panel/content/chat-streaming-status";
import { useChatEvent } from "@/features/chats/hooks/use-chat-event";
import { useChatStore } from "@/features/chats/store/chat-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatPanelInputForm() {
  const isComposingRef = useRef<boolean>(false);
  const t = useTranslations<AppMessageKeys>("Chat");
  const mode = useChatStore((s) => s.mode);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendMessage = useChatEvent();
  const [hasMessage, setHasMessage] = useState(false);
  const isSendingAvailable = !isStreaming && hasMessage;

  const handleSubmit = async () => {
    if (!isSendingAvailable) {
      return;
    }

    const message = textareaRef.current?.value.trim();
    if (!message) {
      setHasMessage(false);
      return;
    }

    try {
      await sendMessage(message);
    } catch {
      toast.error(t("toast.responseUnavailable"));
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
        onChange={(event) => setHasMessage(Boolean(event.target.value.trim()))}
        onKeyDown={handleKeyDown}
        placeholder={t("input.placeholder")}
        className="h-24 focus-visible:ring-[0px] focus-visible:ring-accent-foreground"
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
      />
      <div className="flex justify-between">
        <ChatStreamingStatus />

        <div className="flex flex-col justify-end">
          <Button
            type="submit"
            className="self-end-safe"
            disabled={!isSendingAvailable}
          >
            {t("action.send")}
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
  const t = useTranslations<AppMessageKeys>("Chat");
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
      {t("input.credits", { count: estimatedCredits.toLocaleString() })}
    </span>
  );
}

function PersistentWorkflowCreditEstimate() {
  const estimatedCredits = useChatStore((s) => s.estimatedCredits);
  const t = useTranslations<AppMessageKeys>("Chat");
  if (estimatedCredits == null) return null;

  return (
    <span className="text-end text-[10px] text-muted-foreground">
      {t("input.credits", { count: estimatedCredits.toLocaleString() })}
    </span>
  );
}
