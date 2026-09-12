import { ChatGroq } from "@langchain/groq";

/** Groq 1.0.4 leaves finish_reason in generationInfo; retain it on the message
 * consumed by invoke/stream so truncated answers cannot be settled as success. */
export class CompatibleChatGroq extends ChatGroq {
  async *_streamResponseChunks(
    ...args: Parameters<ChatGroq["_streamResponseChunks"]>
  ) {
    for await (const chunk of super._streamResponseChunks(...args)) {
      if (chunk.generationInfo?.finish_reason)
        chunk.message.response_metadata = {
          ...chunk.message.response_metadata,
          finish_reason: chunk.generationInfo.finish_reason,
        };
      yield chunk;
    }
  }
  async _generateNonStreaming(
    ...args: Parameters<ChatGroq["_generateNonStreaming"]>
  ) {
    const result = await super._generateNonStreaming(...args);
    for (const generation of result.generations)
      generation.message.response_metadata = {
        ...generation.message.response_metadata,
        ...generation.generationInfo,
      };
    return result;
  }
}
