import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { type ApiErrorPayload } from "@/app/api/_types/api-error";
import { clientStreamEventSchema } from "@/app/api/chat/_types/chat-events";
import { type NodeType } from "@/features/canvas/constants/node-types";
import { useUpdateChatTitleIfMissingMutation } from "@/features/chats/lib/query/mutations";
import { useChatStore } from "@/features/chats/store/chat-store";
import { createHumanMessage } from "@/features/chats/utils/chat-message";
import { updateCreditTagsAction } from "@/features/credits/server/actions";
import { updateDocumentsTagsAction } from "@/features/documents/server/actions";
import {
  ApiClientError,
  parseApiErrorPayload,
  resolveApiToastMessage,
} from "@/lib/errors/api-client-error";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const TRACKED_RUNNING_NODE_TYPES = new Set<NodeType>([
  "searchNode",
  "documentNode",
  "chatNode",
]);

const shouldTrackRunningNodeType = (type: NodeType) => {
  return TRACKED_RUNNING_NODE_TYPES.has(type);
};

const resolveTarget = ({
  mode,
  storedThreadId,
  storedChatId,
}: {
  mode: string;
  storedThreadId: string | null;
  storedChatId: string | null;
}) => {
  const isPersistent = mode === "persistent";
  return {
    endpointBase: isPersistent ? "/api/chat/persistent" : "/api/chat/temporary",
    targetId: isPersistent ? storedChatId : storedThreadId,
  };
};

export function useChatEvent() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const updateChatTitleIfMissingMutation =
    useUpdateChatTitleIfMissingMutation();
  const mode = useChatStore((s) => s.mode);
  const storedThreadId = useChatStore((s) => s.threadId);
  const storedChatId = useChatStore((s) => s.chatId);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const resetRunningNodes = useChatStore((s) => s.resetRunningNodes);
  const hasMessages = useChatStore((s) => Boolean(s.messages.length));

  const { openEventSource, closeEventSource } = useChatEventSource();

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
      const { targetId, endpointBase } = resolveTarget({
        mode,
        storedChatId,
        storedThreadId,
      });

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
        const parsedError = parseApiErrorPayload(payload);
        if (parsedError) {
          throw new ApiClientError(parsedError);
        }

        throw new ApiClientError({
          message: t("errors.responseUnavailable"),
          type: "server_error",
          code: "internal_error",
        });
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
              updateChatTitleIfMissingMutation
                .mutateAsync({ chatId: targetId, title })
                .catch(() => null);
            })
            .catch(() => null);
        }
      }

      openEventSource();
    } catch (error) {
      setIsStreaming(false);
      resetRunningNodes();
      closeEventSource();
      throw error;
    }
  };

  return sendMessage;
}

/**
 * EventSource 생성/교체/종료를 담당하고, 필요한 채팅 스토어 액션을 내부에서 직접 구독합니다.
 */
function useChatEventSource() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const queryClient = useQueryClient();
  const mode = useChatStore((s) => s.mode);
  const storedThreadId = useChatStore((s) => s.threadId);
  const storedChatId = useChatStore((s) => s.chatId);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const appendStreamingChunk = useChatStore((s) => s.appendStreamingChunk);
  const initStreamingChunk = useChatStore((s) => s.initStreamingChunk);
  const flushStreamingToMessages = useChatStore(
    (s) => s.flushStreamingToMessages,
  );
  const startRunningNode = useChatStore((s) => s.startRunningNode);
  const finishRunningNode = useChatStore((s) => s.finishRunningNode);
  const resetRunningNodes = useChatStore((s) => s.resetRunningNodes);
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamErrorShownRef = useRef(false);
  const { appendPendingChunk, resetPendingChunks } = usePendingChunkBuffer({
    appendStreamingChunk,
  });

  const closeEventSource = useCallback(() => {
    if (!eventSourceRef.current) {
      return;
    }
    eventSourceRef.current.close();
    eventSourceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (mode === "persistent") {
        return;
      }
      closeEventSource();
    };
  }, [closeEventSource, mode]);

  const openEventSource = useCallback(() => {
    const { endpointBase, targetId } = resolveTarget({
      mode,
      storedChatId,
      storedThreadId,
    });
    if (!targetId) {
      return;
    }

    resetPendingChunks();
    streamErrorShownRef.current = false;
    closeEventSource();

    const eventSource = new EventSource(`${endpointBase}/${targetId}`);
    eventSourceRef.current = eventSource;

    const notifyStreamErrorOnce = (payload?: ApiErrorPayload) => {
      if (streamErrorShownRef.current) {
        return;
      }
      streamErrorShownRef.current = true;
      toast.error(
        resolveApiToastMessage({
          t,
          code: payload?.code,
          fallbackKey: "toast.streamFailed",
        }),
      );
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
              appendPendingChunk(nodeId, delta);
            }
          }

          if (data.event === "on_chat_model_end") {
            finishRunningNode(nodeId);
            void updateCreditTagsAction().catch(() => null);
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

          if (data.type === "documentNode") {
            const referenceId = data.chunk?.referenceId;
            if (referenceId) {
              void updateDocumentsTagsAction(referenceId)
                .catch(() => null)
                .finally(() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["documents", "recent", "picker"],
                  });
                });
            }
          }
        }

        if (data.type === "endNode" && data.event === "on_chain_end") {
          if (data.error) {
            notifyStreamErrorOnce(data.error);
          }
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
  }, [
    appendPendingChunk,
    closeEventSource,
    finishRunningNode,
    flushStreamingToMessages,
    initStreamingChunk,
    mode,
    queryClient,
    resetPendingChunks,
    resetRunningNodes,
    setIsStreaming,
    startRunningNode,
    storedChatId,
    storedThreadId,
    t,
  ]);

  return { openEventSource, closeEventSource };
}

/**
 * 노드별로 스트리밍 delta를 버퍼링하고, animation frame 단위로 한 번에 처리합니다.
 * reset 함수를 통해 대기 중인 chunk를 비울 수 있습니다.
 */
function usePendingChunkBuffer({
  appendStreamingChunk,
}: {
  appendStreamingChunk: (params: { nodeId: string; delta: string }) => void;
}) {
  const pendingChunkMapRef = useRef<Record<string, string>>({});
  const pendingChunkRafRef = useRef<number | null>(null);

  const appendPendingChunk = useCallback(
    (nodeId: string, delta: string) => {
      pendingChunkMapRef.current[nodeId] =
        (pendingChunkMapRef.current[nodeId] ?? "") + delta;
      if (pendingChunkRafRef.current !== null) {
        return;
      }

      pendingChunkRafRef.current = requestAnimationFrame(() => {
        pendingChunkRafRef.current = null;
        const pendingChunkMap = pendingChunkMapRef.current;
        const pendingEntries = Object.entries(pendingChunkMap);
        if (pendingEntries.length === 0) {
          return;
        }

        pendingChunkMapRef.current = {};

        for (const [nodeId, delta] of pendingEntries) {
          if (!delta) continue;
          appendStreamingChunk({ nodeId, delta });
        }
      });
    },
    [appendStreamingChunk],
  );

  const resetPendingChunks = useCallback(() => {
    if (pendingChunkRafRef.current !== null) {
      cancelAnimationFrame(pendingChunkRafRef.current);
      pendingChunkRafRef.current = null;
    }
    pendingChunkMapRef.current = {};
  }, []);

  useEffect(() => {
    return () => {
      resetPendingChunks();
    };
  }, [resetPendingChunks]);

  return { appendPendingChunk, resetPendingChunks };
}
