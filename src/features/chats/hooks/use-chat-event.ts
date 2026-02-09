import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { clientStreamEventSchema } from "@/app/api/chat/_types/chat-events";
import { updateChatTitleIfMissing } from "@/features/chats/server/actions";
import { useChatStore } from "@/features/chats/store/chat-store";
import { createHumanMessage } from "@/features/chats/utils/chat-message";
import { updateCreditTagsAction } from "@/features/credits/server/actions";

export function useChatEvent() {
  const eventSourceRef = useRef<EventSource | null>(null);
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
    closeEventSource();
    eventSourceRef.current = new EventSource(`${endpointBase}/${targetId}`);
    const eventSource = eventSourceRef.current;

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
          }

          if (data.event === "on_chat_model_stream") {
            const delta = data.chunk?.content;
            if (delta) {
              appendStreamingChunk({ nodeId, delta });
            }
          }
          return;
        }
        if (data.type === "endNode" && data.event === "on_chain_end") {
          updateCreditTagsAction().catch(() => null);
          flushStreamingToMessages();
          setIsStreaming(false);
          closeEventSource();
        }
      } catch (error) {
        console.error("chat stream parse error:", error);
        setIsStreaming(false);
        closeEventSource();
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
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
    setIsStreaming(true);

    try {
      const { targetId, endpointBase } = resolveTarget();

      if (!targetId) {
        throw new Error(
          mode === "persistent" ? "chatId가 없습니다." : "threadId가 없습니다.",
        );
      }

      const response = await fetch(`${endpointBase}/${targetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "응답을 받을 수 없습니다.";
        throw new Error(message);
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
              updateChatTitleIfMissing({ chatId: targetId, title }).catch(
                () => null,
              );
            })
            .catch(() => null);
        }
      }

      openEventSource({ endpointBase, targetId });
    } catch (error) {
      setIsStreaming(false);
      closeEventSource();
      throw error;
    }
  };

  return sendMessage;
}
