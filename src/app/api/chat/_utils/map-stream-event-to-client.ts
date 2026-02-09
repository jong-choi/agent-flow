import {
  type ClientStreamEvent,
  type LanggraphStreamEvent,
} from "@/app/api/chat/_types/chat-events";

export const mapLanggraphEventToClientEvent = (
  source: LanggraphStreamEvent,
): ClientStreamEvent | null => {
  const { event, metadata, data } = source;
  const { type, langgraph_node } = metadata;

  if (type === "chatNode") {
    if (event === "on_chat_model_start" || event === "on_chat_model_end") {
      return { type, event, langgraph_node };
    }

    if (event === "on_chat_model_stream") {
      const content = data?.chunk?.content;
      if (typeof content !== "string") {
        return null;
      }

      return {
        type,
        event,
        langgraph_node,
        chunk: { content },
      };
    }

    return null;
  }

  if (event === "on_chain_start" || event === "on_chain_end") {
    return { type, event, langgraph_node };
  }

  return null;
};
