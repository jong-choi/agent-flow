import {
  type BaseMessage,
  type StoredMessage,
  isBaseMessage,
} from "@langchain/core/messages";
import {
  mapProviderErrorToApi,
  mapUnknownToApiTypedError,
} from "@/app/api/_errors/api-error";
import {
  type ClientStreamEvent,
  langgraphStreamEventSchema,
} from "@/app/api/chat/_types/chat-events";
import { mapLanggraphEventToClientEvent } from "@/app/api/chat/_utils/map-stream-event-to-client";
import { storeModelMessages } from "@/lib/ai/history";
import { getAnswerText } from "@/lib/ai/message";

export const CHAT_STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/** Shared by temporary and persistent chats. Completion is emitted after durable work finishes. */
export function createChatStream(options: {
  signal: AbortSignal;
  events: (signal: AbortSignal) => AsyncIterable<unknown>;
  onFinally?: () => Promise<void>;
  onComplete?: (
    answer: string,
    modelMessages: StoredMessage[],
  ) => Promise<void>;
}) {
  const abort = new AbortController();
  const signal = AbortSignal.any([options.signal, abort.signal]);
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const answers = new Map<string, string>();
      const generated = new Map<string, BaseMessage>();
      let completion: ClientStreamEvent | undefined;
      const emit = (event: ClientStreamEvent) => {
        if (!cancelled && !signal.aborted)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
      };
      try {
        signal.throwIfAborted();
        for await (const event of options.events(signal)) {
          signal.throwIfAborted();
          const parsed = langgraphStreamEventSchema.safeParse(event);
          if (!parsed.success) continue;
          const source = parsed.data;
          const output = source.data?.output;
          if (
            source.metadata.type === "chatNode" &&
            source.event === "on_chain_end" &&
            output &&
            typeof output === "object" &&
            "messages" in output &&
            Array.isArray(output.messages)
          ) {
            const nodeId = source.metadata.langgraph_node;
            if (nodeId && !answers.has(nodeId)) {
              const text = output.messages
                .filter(isBaseMessage)
                .map((m) => getAnswerText(m.content))
                .join("\n\n");
              answers.set(nodeId, text);
              emit({
                type: "chatNode",
                event: "on_chat_model_start",
                langgraph_node: nodeId,
              });
              emit({
                type: "chatNode",
                event: "on_chat_model_stream",
                langgraph_node: nodeId,
                chunk: { content: text },
              });
              emit({
                type: "chatNode",
                event: "on_chat_model_end",
                langgraph_node: nodeId,
              });
            }
            for (const message of output.messages)
              if (isBaseMessage(message))
                generated.set(
                  `${source.metadata.langgraph_node}:${message.id ?? JSON.stringify(message.toDict())}`,
                  message,
                );
          }
          const mapped = mapLanggraphEventToClientEvent(source);
          if (!mapped) continue;
          const nodeId = mapped.langgraph_node;
          if (mapped.type === "chatNode" && nodeId) {
            if (mapped.event === "on_chat_model_start") answers.set(nodeId, "");
            if (mapped.event === "on_chat_model_stream")
              answers.set(
                nodeId,
                (answers.get(nodeId) ?? "") + (mapped.chunk?.content ?? ""),
              );
            const output = source.data?.output;
            if (
              mapped.event === "on_chat_model_end" &&
              output !== null &&
              typeof output === "object" &&
              "content" in output
            ) {
              answers.set(nodeId, getAnswerText(output.content));
            }
          }
          if (mapped.type === "endNode" && mapped.event === "on_chain_end")
            completion = mapped;
          else emit(mapped);
        }
        signal.throwIfAborted();
        await options.onComplete?.(
          [...answers.values()].join("\n\n"),
          storeModelMessages([...generated.values()]),
        );
        if (completion) emit(completion);
      } catch (error) {
        if (!signal.aborted) {
          const mapped =
            error instanceof Error &&
            (error.name === "AbortError" || error.name === "TimeoutError")
              ? mapProviderErrorToApi(error)
              : mapUnknownToApiTypedError(error);
          if (mapped.provider)
            console.warn("Model invocation failed", mapped.provider);
          emit({
            type: "endNode",
            event: "on_chain_end",
            error: {
              message: mapped.message,
              type: mapped.type,
              code: mapped.code,
            },
          });
        }
      } finally {
        try {
          await options.onFinally?.();
        } finally {
          if (!cancelled) controller.close();
        }
      }
    },
    cancel() {
      cancelled = true;
      abort.abort();
    },
  });
}
