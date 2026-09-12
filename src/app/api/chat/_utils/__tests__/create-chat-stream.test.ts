// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mapProviderErrorToApi } from "@/app/api/_errors/api-error";
import { clientStreamEventSchema } from "../../_types/chat-events";
import { createChatStream } from "../create-chat-stream";

const event = (event: string, content?: unknown) => ({
  event,
  metadata: { type: "chatNode", langgraph_node: "chat" },
  data: { chunk: { content } },
});
const end = {
  event: "on_chain_end",
  metadata: { type: "endNode", langgraph_node: "end" },
};
const parse = (raw: string) =>
  raw
    .trim()
    .split("\n\n")
    .map((frame) => clientStreamEventSchema.parse(JSON.parse(frame.slice(6))));

describe("chat SSE lifecycle", () => {
  it("persists the same normalized answer before emitting completion, then closes", async () => {
    let stored = "";
    const stream = createChatStream({
      signal: new AbortController().signal,
      events: async function* () {
        yield event("on_chat_model_start");
        yield event("on_chat_model_stream", [
          { type: "text", thought: true, text: "hidden" },
        ]);
        yield event("on_chat_model_stream", [{ type: "text", text: "안녕" }]);
        yield event("on_chat_model_stream", " 세상");
        yield {
          ...event("on_chat_model_end"),
          data: {
            output: {
              content: [
                { type: "text", thought: true, text: "hidden" },
                { type: "text", text: "안녕 세상" },
              ],
            },
          },
        };
        yield end;
      },
      onComplete: async (text) => {
        stored = text;
      },
    });
    const events = parse(await new Response(stream).text());
    expect(stored).toBe("안녕 세상");
    expect(
      events
        .filter((e) => e.event === "on_chat_model_stream")
        .map((e) => e.chunk?.content ?? "")
        .join(""),
    ).toBe(stored);
    expect(events.at(-1)?.type).toBe("endNode");
  });
  it("sends one error completion and never saves a partial generation", async () => {
    let stored = false;
    const stream = createChatStream({
      signal: new AbortController().signal,
      events: async function* () {
        yield event("on_chat_model_stream", "partial");
        throw mapProviderErrorToApi({
          status_code: 429,
          message: "secret provider body",
        });
      },
      onComplete: async () => {
        stored = true;
      },
    });
    const events = parse(await new Response(stream).text());
    expect(events.at(-1)?.error?.type).toBe("provider_error");
    expect(JSON.stringify(events)).not.toContain("secret provider body");
    expect(stored).toBe(false);
  });
  it("propagates reader cancellation to upstream", async () => {
    let aborted = false;
    const stream = createChatStream({
      signal: new AbortController().signal,
      events: async function* (signal) {
        yield event("on_chat_model_stream", "first");
        await new Promise<void>((resolve) => {
          if (signal.aborted) resolve();
          else
            signal.addEventListener(
              "abort",
              () => {
                aborted = true;
                resolve();
              },
              { once: true },
            );
        });
        aborted = signal.aborted;
      },
    });
    const reader = stream.getReader();
    await reader.read();
    await reader.cancel();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(aborted).toBe(true);
  });
});
