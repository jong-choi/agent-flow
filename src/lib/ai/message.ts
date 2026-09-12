/** Text presented to users and passed to downstream nodes. Never mutate the source message. */
export function getAnswerText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (block) =>
        block?.type === "text" &&
        block.thought !== true &&
        block.is_thought !== true,
    )
    .map((block) => (typeof block.text === "string" ? block.text : ""))
    .join("");
}

export interface ModelMessage {
  content: unknown;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
  usage_metadata?: unknown;
}

export function getModelResponse(message: ModelMessage) {
  const metadata = message.response_metadata ?? {};
  const blocks = Array.isArray(message.content) ? message.content : [];
  const reasoning =
    blocks
      .map((block) => {
        if (block?.type === "reasoning")
          return typeof block.reasoning === "string" ? block.reasoning : "";
        return block?.thought === true && typeof block.text === "string"
          ? block.text
          : "";
      })
      .join("") ||
    message.additional_kwargs?.reasoning_content ||
    "";
  return {
    answer: getAnswerText(message.content),
    reasoning: typeof reasoning === "string" ? reasoning : "",
    // Do not infer missing reasoning tokens or double-count cumulative usage chunks.
    usage: message.usage_metadata ?? null,
    finishReason:
      metadata.finish_reason ??
      metadata.finishReason ??
      metadata.done_reason ??
      message.additional_kwargs?.finishReason ??
      null,
  };
}

/** Do not charge or persist a reasoning-only or truncated generation as a completed answer. */
export function assertCompleteAnswer(message: ModelMessage) {
  const result = getModelResponse(message);
  const failed = [
    "length",
    "MAX_TOKENS",
    "SAFETY",
    "RECITATION",
    "PROHIBITED_CONTENT",
    "BLOCKLIST",
    "SPII",
  ];
  if (!result.answer.trim() || failed.includes(String(result.finishReason))) {
    throw Object.assign(new Error("Model did not produce a complete answer"), {
      status: 422,
      code: result.finishReason ?? "EMPTY_RESPONSE",
    });
  }
  return result;
}
