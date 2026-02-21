import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useNodes } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { ChatStreamingStatus } from "@/features/chats/components/chat-panel/content/chat-streaming-status";
import { useChatEvent } from "@/features/chats/hooks/use-chat-event";
import { useChatStore } from "@/features/chats/store/chat-store";
import { CHAT_MESSAGE_QUEUE_LIMIT } from "@/features/chats/store/slices/chat-message-queue-slice";
import {
  isApiClientError,
  resolveApiToastMessage,
} from "@/lib/errors/api-client-error";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatPanelInputForm() {
  const isComposingRef = useRef<boolean>(false);
  const t = useTranslations<AppMessageKeys>("Chat");
  const mode = useChatStore((s) => s.mode);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isQueueFull = useChatStore(
    (s) => s.messageQueue.length >= CHAT_MESSAGE_QUEUE_LIMIT,
  );
  const enqueueMessageQueue = useChatStore((s) => s.enqueueMessageQueue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendMessage = useChatEvent();
  const [hasMessage, setHasMessage] = useState(false);
  const isSendingAvailable = hasMessage && (!isStreaming || !isQueueFull);

  const clearInput = () => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.value = "";
    setHasMessage(false);
  };

  const handleSubmit = () => {
    const message = textareaRef.current?.value.trim();
    if (!textareaRef.current || !message) {
      setHasMessage(false);
      return;
    }

    if (isStreaming) {
      if (isQueueFull) return;
      clearInput();
      enqueueMessageQueue(message);
      return;
    }

    clearInput();
    void sendMessage(message).catch((error) => {
      toast.error(
        resolveApiToastMessage({
          t,
          code: isApiClientError(error) ? error.payload.code : undefined,
          fallbackKey: "toast.responseUnavailable",
        }),
      );
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSendingAvailable) {
      return;
    }
    void handleSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !isComposingRef.current
    ) {
      if (!isSendingAvailable) {
        return;
      }
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleFormSubmit}>
      <ChatPanelInputFormMessageQueue />
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

function ChatPanelInputFormMessageQueue() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const queuedMessages = useChatStore((s) => s.messageQueue);
  const removeMessageQueue = useChatStore((s) => s.removeMessageQueue);
  const sendMessage = useChatEvent();
  const isStreaming = useChatStore((s) => s.isStreaming);

  useEffect(() => {
    if (isStreaming) {
      return;
    }

    const nextQueuedMessage = queuedMessages[0];
    if (!nextQueuedMessage) {
      return;
    }

    removeMessageQueue(nextQueuedMessage.id);

    void sendMessage(nextQueuedMessage.message).catch((error) => {
      toast.error(
        resolveApiToastMessage({
          t,
          code: isApiClientError(error) ? error.payload.code : undefined,
          fallbackKey: "toast.responseUnavailable",
        }),
      );
    });
  }, [isStreaming, queuedMessages, removeMessageQueue, sendMessage, t]);

  if (queuedMessages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end">
        <span className="text-[10px] text-muted-foreground">
          {queuedMessages.length}/{CHAT_MESSAGE_QUEUE_LIMIT}
        </span>
      </div>
      {queuedMessages.map((queuedMessage) => (
        <div
          key={queuedMessage.id}
          className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2 py-1"
        >
          <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
          <span
            title={queuedMessage.message}
            className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
          >
            {queuedMessage.message}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("action.delete")}
            className="size-6 text-muted-foreground hover:text-foreground"
            onClick={() => {
              removeMessageQueue(queuedMessage.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
