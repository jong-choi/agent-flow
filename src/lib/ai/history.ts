import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  type StoredMessage,
  SystemMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";
import type { AiModel } from "@/db/schema/ai-models";
import { getAnswerText } from "./message";

export function tagModelMessage(message: AIMessage, model: AiModel) {
  return new AIMessage({
    id: message.id,
    name: message.name,
    content: message.content,
    tool_calls: message.tool_calls,
    invalid_tool_calls: message.invalid_tool_calls,
    response_metadata: message.response_metadata,
    usage_metadata: message.usage_metadata,
    additional_kwargs: {
      ...message.additional_kwargs,
      agentflowModel: {
        provider: model.provider,
        upstreamModelId: model.upstreamModelId,
      },
    },
  });
}
/** Provider-specific signatures are only replayed to the same provider and model. */
export function prepareModelMessages(
  messages: BaseMessage[],
  model: AiModel,
): BaseMessage[] {
  let preserveToolResults = false;
  return messages.map((message) => {
    if (message.getType() === "ai") {
      const origin = message.additional_kwargs?.agentflowModel as
        | { provider?: string; upstreamModelId?: string }
        | undefined;
      const same =
        origin?.provider === model.provider &&
        origin.upstreamModelId === model.upstreamModelId;
      preserveToolResults = same;
      const plainLegacy =
        !origin &&
        typeof message.content === "string" &&
        Object.keys(message.additional_kwargs ?? {}).length === 0 &&
        !(message as AIMessage).tool_calls?.length;
      return same || plainLegacy
        ? message
        : new AIMessage({
            id: message.id,
            content: getAnswerText(message.content),
          });
    }
    if (message.getType() === "tool" && !preserveToolResults)
      return new HumanMessage({
        id: message.id,
        content: getAnswerText(message.content),
      });
    return message;
  });
}
export const storeModelMessages = (messages: BaseMessage[]) =>
  mapChatMessagesToStoredMessages(messages);
export function restoreChatMessage(row: {
  id: string;
  role: string;
  content: string;
  modelMessages?: StoredMessage[] | null;
}): BaseMessage[] {
  if (row.modelMessages != null && !Array.isArray(row.modelMessages))
    throw new Error("Invalid model message history");
  if (row.role === "assistant" && row.modelMessages?.length)
    return mapStoredMessagesToChatMessages(row.modelMessages);
  if (row.role === "user")
    return [new HumanMessage({ id: row.id, content: row.content })];
  if (row.role === "assistant")
    return [new AIMessage({ id: row.id, content: row.content })];
  if (row.role === "system")
    return [new SystemMessage({ id: row.id, content: row.content })];
  return [];
}
