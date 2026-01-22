import { type StreamingBlocksState } from "@/features/chat/types/chat-panel-content";

export const createMessageId = () => crypto.randomUUID();

export const createEmptyStreamingState = (): StreamingBlocksState => ({
  order: [],
  blocks: {},
});

export const formatTimestamp = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

export const extractChunkText = (content: unknown) => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
};
