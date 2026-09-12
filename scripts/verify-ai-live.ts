/** Explicit, sequential live check. Raw remains in .local and is never committed. */
import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { ChatGroq } from "@langchain/groq";
import { aiFetch, runAiCall } from "../src/lib/ai/execution";
import { getModelResponse } from "../src/lib/ai/message";

async function main() {
  assert.equal(
    process.env.RUN_AI_LIVE,
    "1",
    "Set RUN_AI_LIVE=1 to make real, quota-consuming requests",
  );
  assert.equal(
    new URL(process.env.DATABASE_URL!).hostname,
    "127.0.0.1",
    "Use the local development DB for live diagnostics",
  );
  const directory = `.local/ai-captures/live-${Date.now()}`;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const originalFetch = globalThis.fetch;
  let pending: Promise<void>[] = [];
  let index = 0;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await originalFetch(request);
    // Only HTTP response bodies from Groq; never authorization headers or credentials.
    if (new URL(request.url).hostname === "api.groq.com") {
      const file = `${directory}/${++index}`;
      pending.push(
        response
          .clone()
          .text()
          .then(async (body) => {
            await writeFile(`${file}.raw`, body, { mode: 0o600 });
            await writeFile(
              `${file}.http.json`,
              JSON.stringify({
                status: response.status,
                contentType: response.headers.get("content-type"),
              }),
              { mode: 0o600 },
            );
          }),
      );
    }
    return response;
  };
  try {
    for (const model of ["openai/gpt-oss-20b", "openai/gpt-oss-120b"]) {
      pending = [];
      const llm = new ChatGroq({
        model,
        apiKey: process.env.GROQ_API_KEY,
        maxTokens: 1024,
        maxRetries: 0,
        fetch: aiFetch,
      });
      const response = await runAiCall((signal) =>
        llm.invoke(
          "한국어로 한 문장만 답해. 12분과 8분 작업을 순차 실행하면 총 몇 분인가?",
          { signal },
        ),
      );
      await Promise.all(pending);
      const normalized = getModelResponse(response);
      assert.ok(normalized.answer.trim());
      await writeFile(
        `${directory}/${model.split("/")[1]}.json`,
        JSON.stringify({ rawMessage: response, normalized }, null, 2),
        { mode: 0o600 },
      );
      console.log(
        `${model}: response/usage captured through shared execution queue`,
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
    await Promise.allSettled(pending);
  }
  console.log(`Raw saved in ${directory}`);
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.name : "Live check failed");
  process.exitCode = 1;
});
