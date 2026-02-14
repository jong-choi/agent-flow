import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { clientStreamEventSchema } from "@/app/api/chat/_types/chat-events";
import { type NodeType } from "@/features/canvas/constants/node-types";
import { useUpdateChatTitleIfMissingMutation } from "@/features/chats/lib/query/mutations";
import { useChatStore } from "@/features/chats/store/chat-store";
import { createHumanMessage } from "@/features/chats/utils/chat-message";
import { updateCreditTagsAction } from "@/features/credits/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const TRACKED_RUNNING_NODE_TYPES = new Set<NodeType>([
  "searchNode",
  "documentNode",
  "chatNode",
]);

const shouldTrackRunningNodeType = (type: NodeType) => {
  return TRACKED_RUNNING_NODE_TYPES.has(type);
};

export function useChatEvent() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const updateChatTitleIfMissingMutation = useUpdateChatTitleIfMissingMutation();
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamErrorShownRef = useRef(false);
  const searchParams = useSearchParams();
  const searchThreadId = searchParams.get("thread_id");
  const mode = useChatStore((s) => s.mode);
  const storedThreadId = useChatStore((s) => s.threadId);
  const storedChatId = useChatStore((s) => s.chatId);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const appendStreamingChunk = useChatStore((s) => s.appendStreamingChunk);
  const initStreamingChunk = useChatStore((s) => s.initStreamingChunk);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const flushStreamingToMessages = useChatStore(
    (s) => s.flushStreamingToMessages,
  );
  const startRunningNode = useChatStore((s) => s.startRunningNode);
  const finishRunningNode = useChatStore((s) => s.finishRunningNode);
  const resetRunningNodes = useChatStore((s) => s.resetRunningNodes);
  const hasMessages = useChatStore((s) => Boolean(s.messages.length));

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mode === "persistent") {
        return;
      }
      closeEventSource();
    };
  }, [closeEventSource, mode]);

  const resolveTarget = () => {
    let threadId = storedThreadId ?? searchThreadId;
    let chatId = storedChatId;
    let endpointBase = "/api/chat/temporary";

    if (mode === "persistent") {
      threadId = null;
      endpointBase = "/api/chat/persistent";
    } else {
      chatId = null;
    }

    const targetId = mode === "persistent" ? chatId : threadId;
    return { targetId, endpointBase };
  };

  const openEventSource = ({
    endpointBase,
    targetId,
  }: {
    endpointBase: string;
    targetId: string;
  }) => {
    streamErrorShownRef.current = false;
    closeEventSource();
    eventSourceRef.current = new EventSource(`${endpointBase}/${targetId}`);
    const eventSource = eventSourceRef.current;
    const notifyStreamError = () => {
      if (streamErrorShownRef.current) {
        return;
      }
      streamErrorShownRef.current = true;
      toast.error(t("toast.streamFailed"));
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = clientStreamEventSchema.safeParse(
          JSON.parse(event.data),
        );
        if (!parsed.success) {
          throw new Error("Invalid chat stream event payload");
        }

        const data = parsed.data;

        if (data.type === "chatNode") {
          const nodeId = data.langgraph_node;
          if (!nodeId) return;

          if (data.event === "on_chat_model_start") {
            initStreamingChunk({ nodeId });
            if (shouldTrackRunningNodeType(data.type)) {
              startRunningNode({ id: nodeId, type: data.type });
            }
          }

          if (data.event === "on_chat_model_stream") {
            const delta = data.chunk?.content;
            if (delta) {
              appendStreamingChunk({ nodeId, delta });
            }
          }

          if (data.event === "on_chat_model_end") {
            finishRunningNode(nodeId);
          }
          return;
        }

        if (data.event === "on_chain_start") {
          const nodeId = data.langgraph_node;
          if (nodeId && shouldTrackRunningNodeType(data.type)) {
            startRunningNode({ id: nodeId, type: data.type });
          }
        }

        if (data.event === "on_chain_end") {
          const nodeId = data.langgraph_node;
          if (nodeId && shouldTrackRunningNodeType(data.type)) {
            finishRunningNode(nodeId);
          }
        }

        if (data.type === "endNode" && data.event === "on_chain_end") {
          if (data.error) {
            notifyStreamError();
          }
          updateCreditTagsAction().catch(() => null);
          flushStreamingToMessages();
          setIsStreaming(false);
          resetRunningNodes();
          closeEventSource();
        }
      } catch (error) {
        console.error("chat stream parse error:", error);
        setIsStreaming(false);
        resetRunningNodes();
        closeEventSource();
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
      resetRunningNodes();
      closeEventSource();
    };
  };

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const isFirstMessage = !hasMessages;
    appendMessage(createHumanMessage(trimmedMessage));
    resetRunningNodes();
    setIsStreaming(true);

    try {
      const { targetId, endpointBase } = resolveTarget();

      if (!targetId) {
        throw new Error(
          mode === "persistent"
            ? t("errors.missingChatId")
            : t("errors.missingThreadId"),
        );
      }

      const response = await fetch(`${endpointBase}/${targetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(t("errors.responseUnavailable"));
      }

      if (mode === "persistent") {
        const hasTitle = Boolean(payload?.hasTitle);
        if (isFirstMessage && !hasTitle) {
          void fetch(`/api/chat/persistent/${targetId}/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: trimmedMessage }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              const title =
                typeof data?.title === "string" ? data.title.trim() : "";
              if (!title) return;
              void updateChatTitleIfMissingMutation
                .mutateAsync({ chatId: targetId, title })
                .catch(() => null);
            })
            .catch(() => null);
        }
      }

      openEventSource({ endpointBase, targetId });
    } catch (error) {
      setIsStreaming(false);
      resetRunningNodes();
      closeEventSource();
      throw error;
    }
  };

  return sendMessage;
}
