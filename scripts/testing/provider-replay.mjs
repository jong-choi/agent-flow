// Explicit local test preloader: NODE_OPTIONS='--import ./scripts/testing/provider-replay.mjs'.
// Every model request is intercepted, so browser regressions cannot spend provider quota.
import { appendFileSync, mkdirSync } from "node:fs";

if (!process.env.DATABASE_URL) await import("dotenv/config");

if (process.env.AI_PROVIDER_REPLAY !== "1")
  throw Error("AI_PROVIDER_REPLAY=1 required");
if (
  ![
    "127.0.0.1",
    ...(process.env.AI_REPLAY_CONTAINER === "1"
      ? ["agent-flow-postgres-1"]
      : []),
  ].includes(new URL(process.env.DATABASE_URL).hostname)
)
  throw Error("Local replay DB required");
const directory =
  process.env.AI_REPLAY_CONTAINER === "1"
    ? "/tmp/agentflow-replay"
    : ".local/replay";
mkdirSync(directory, { recursive: true, mode: 0o700 });
const original = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (
    ![
      "api.groq.com",
      "ollama.com",
      "generativelanguage.googleapis.com",
    ].includes(url.hostname)
  )
    return original(input, init);
  const body = await request.json();
  const model = body.model ?? url.pathname.split("/models/")[1]?.split(":")[0];
  appendFileSync(
    directory + "/requests.jsonl",
    JSON.stringify({ model, at: Date.now() }) + "\n",
    { mode: 0o600 },
  );
  if (url.hostname !== "api.groq.com")
    throw Error("Replay tests must select a Groq fixture model");
  if (model === "fixture-error")
    return Response.json(
      { error: { message: "Fixture unavailable", code: "fixture_503" } },
      { status: 503 },
    );
  const content = model === "fixture-empty" ? "" : "검증 응답입니다.";
  const finish = model === "fixture-truncated" ? "length" : "stop";
  const base = {
    id: "fixture-" + crypto.randomUUID(),
    object: "chat.completion.chunk",
    created: 1,
    model,
  };
  if (!body.stream)
    return Response.json({
      ...base,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: finish,
        },
      ],
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
    });
  const encode = new TextEncoder();
  let stopped = false,
    timer;
  const stream = new ReadableStream({
    start(controller) {
      const emit = (delta, finish_reason = null) =>
        controller.enqueue(
          encode.encode(
            "data: " +
              JSON.stringify({
                ...base,
                choices: [{ index: 0, delta, finish_reason }],
              }) +
              "\n\n",
          ),
        );
      const abort = () => {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        controller.error(new DOMException("Aborted", "AbortError"));
      };
      request.signal.addEventListener("abort", abort, { once: true });
      if (request.signal.aborted) {
        abort();
        return;
      }
      emit({
        role: "assistant",
        content: model === "fixture-cancel" ? "부분" : content,
      });
      timer = setTimeout(
        () => {
          if (stopped) return;
          stopped = true;
          request.signal.removeEventListener("abort", abort);
          emit({}, finish);
          controller.enqueue(
            encode.encode(
              "data: " +
                JSON.stringify({
                  ...base,
                  choices: [],
                  usage: {
                    prompt_tokens: 2,
                    completion_tokens: 3,
                    total_tokens: 5,
                  },
                }) +
                "\n\ndata: [DONE]\n\n",
            ),
          );
          controller.close();
        },
        model === "fixture-cancel" ? 10000 : 30,
      );
    },
    cancel() {
      stopped = true;
      clearTimeout(timer);
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream" },
  });
};
