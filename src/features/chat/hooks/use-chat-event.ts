import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { clientStreamEventSchema } from "@/app/api/chat/_types/chat-events";
import { useChatStore } from "@/features/chat/store/chat-store";
import { createHumanMessage } from "@/features/chat/utils/chat-message";

export function useChatEvent() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread_id");
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const appendStreamingChunk = useChatStore((s) => s.appendStreamingChunk);
  const initStreamingChunk = useChatStore((s) => s.initStreamingChunk);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const flushStreamingToMessages = useChatStore(
    (s) => s.flushStreamingToMessages,
  );

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, [closeEventSource]);

  const sendMessage = async (message: string) => {
    appendMessage(createHumanMessage(message));

    if (!threadId) {
      throw new Error("threadId가 없습니다.");
    }

    const response = await fetch(`/api/chat/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const payload = await response.json();
      const message =
        typeof payload?.error === "string"
          ? payload.error
          : "응답을 받을 수 없습니다.";
      throw new Error(message);
    }

    closeEventSource();
    eventSourceRef.current = new EventSource(`/api/chat/${threadId}`);
    const eventSource = eventSourceRef.current;

    eventSource.onmessage = (event) => {
      const parsed = clientStreamEventSchema.safeParse(JSON.parse(event.data));
      if (!parsed.success) {
        throw new Error("Invalid chat stream event payload", parsed.error);
      }

      const data = parsed.data;
      if (data.type === "startNode" && data.event === "on_chain_start") {
        setIsStreaming(true);
      }

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
        flushStreamingToMessages();
        setIsStreaming(false);
        closeEventSource();
      }
    };
  };

  return sendMessage;
}
