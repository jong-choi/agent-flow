import postgres from "postgres";
import { createApiError } from "@/app/api/_errors/api-error";

/** Serialize POST/GET per chat, independently of the global provider-call queue. */
export async function acquireChatSession(id: string) {
  const connection = postgres(process.env.DATABASE_URL!, {
    max: 1,
    idle_timeout: 0,
    max_lifetime: 0,
    connect_timeout: 5,
  });
  const key = `agentflow:chat:${id}`;
  let released = false;
  try {
    const [row] =
      await connection`select pg_try_advisory_lock(hashtextextended(${key},0)) locked`;
    if (!row.locked)
      throw createApiError("invalidRequest", {
        message: "This conversation is already running.",
      });
  } catch (error) {
    await connection.end({ timeout: 1 });
    throw error;
  }
  return async () => {
    if (released) return;
    released = true;
    try {
      await connection`select pg_advisory_unlock(hashtextextended(${key},0))`;
    } finally {
      await connection.end({ timeout: 1 });
    }
  };
}
export function replayChatAnswer(answer: string) {
  return new Response(
    [
      {
        type: "chatNode",
        event: "on_chat_model_start",
        langgraph_node: "saved",
      },
      {
        type: "chatNode",
        event: "on_chat_model_stream",
        langgraph_node: "saved",
        chunk: { content: answer },
      },
      { type: "chatNode", event: "on_chat_model_end", langgraph_node: "saved" },
      { type: "endNode", event: "on_chain_end", langgraph_node: "end" },
    ]
      .map((event) => `data: ${JSON.stringify(event)}\n\n`)
      .join(""),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    },
  );
}
