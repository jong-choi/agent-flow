import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  HumanMessage,
  ToolMessage,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";
import {
  type ThinkingLevel,
  createProviderModel,
} from "../src/lib/ai/adapters";
import { runAiCall } from "../src/lib/ai/execution";
import {
  prepareModelMessages,
  storeModelMessages,
  tagModelMessage,
} from "../src/lib/ai/history";
import { assertCompleteAnswer, getModelResponse } from "../src/lib/ai/message";
import { listModelRegistry } from "../src/lib/ai/registry-store";

async function main() {
  assert.equal(process.env.RUN_AI_LIVE, "1");
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "127.0.0.1");
  const out = `.local/ai-captures/features-${Date.now()}`;
  await mkdir(out, { recursive: true, mode: 0o700 });
  const models = await listModelRegistry();
  const report = [];
  const native = globalThis.fetch;
  let n = 0;
  const captures: Promise<unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const id = ++n;
    await writeFile(`${out}/${id}-request.json`, await req.clone().text(), {
      mode: 0o600,
    });
    const r = await native(req);
    const saved = r
      .clone()
      .text()
      .then((body) =>
        writeFile(`${out}/${id}-response.raw`, body, { mode: 0o600 }),
      );
    captures.push(saved);
    void saved.catch(() => {});
    return r;
  };
  try {
    for (const [provider, upstream] of [
      ["google", "gemini-3.5-flash-lite"],
      ["google", "gemma-4-26b-a4b-it"],
      ["google", "gemma-4-31b-it"],
      ["ollama", "gpt-oss:20b"],
      ["ollama", "gpt-oss:120b"],
    ]) {
      if (
        process.env.AI_FEATURE_MODELS &&
        !process.env.AI_FEATURE_MODELS.split(",").includes(upstream)
      )
        continue;
      const row = models.find(
        (m) => m.provider === provider && m.upstreamModelId === upstream,
      )!;
      assert.ok(row?.isActive);
      for (const level of (provider === "google"
        ? ["minimal", "high"]
        : ["low", "high"]) as ThinkingLevel[]) {
        const model = {
          ...row,
          metadata: { ...row.metadata, thinkingLevel: level },
        };
        const llm = createProviderModel(model)!;
        const answer = await runAiCall((signal) =>
          llm.invoke(
            "A=12분, B=8분. C=5분은 A 후, D=7분은 B 후 시작. E=3분은 C와 D 후 시작한다. 동시 실행이 가능할 때 최소 시간과 임계경로를 두 문장으로 답해.",
            { signal },
          ),
        );
        const normalized = assertCompleteAnswer(answer);
        await writeFile(
          `${out}/${row.id}-${level}.json`,
          JSON.stringify({ message: answer, normalized }, null, 2),
          { mode: 0o600 },
        );
        report.push({
          provider,
          upstream,
          level,
          answer: normalized.answer,
          usage: normalized.usage,
        });
        await writeFile(
          `${out}/results.json`,
          JSON.stringify(report, null, 2),
          { mode: 0o600 },
        );
        console.log(provider, upstream, level, "PASS");
      }
      if (provider === "google" || upstream === "gpt-oss:20b") {
        const llm = createProviderModel(row)!.bindTools([
          {
            type: "function",
            function: {
              name: "get_task_duration",
              description: "Look up duration for a task",
              parameters: {
                type: "object",
                properties: { task: { type: "string" } },
                required: ["task"],
              },
            },
          },
        ]);
        const input = [
          new HumanMessage(
            "get_task_duration 도구로 작업 A의 소요 시간을 확인해줘. 반드시 도구를 호출해.",
          ),
        ];
        const first = await runAiCall((signal) =>
          llm.invoke(input, { signal }),
        );
        assert.ok(first.tool_calls?.length);
        const tagged = tagModelMessage(first, row);
        const stored = JSON.parse(JSON.stringify(storeModelMessages([tagged])));
        const messages = prepareModelMessages(
          [
            ...input,
            ...mapStoredMessagesToChatMessages(stored),
            ...first.tool_calls!.map(
              (tool) =>
                new ToolMessage({
                  tool_call_id: tool.id!,
                  content: '{"minutes":12}',
                }),
            ),
          ],
          row,
        );
        const last = await runAiCall((signal) =>
          llm.invoke(messages, { signal }),
        );
        assertCompleteAnswer(last);
        await writeFile(
          `${out}/${row.id}-tools.json`,
          JSON.stringify(
            { first, stored, last, normalized: getModelResponse(last) },
            null,
            2,
          ),
          { mode: 0o600 },
        );
        console.log(provider, upstream, "serialized tool roundtrip PASS");
      }
    }
    await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2), {
      mode: 0o600,
    });
    console.log("Saved", out);
  } finally {
    globalThis.fetch = native;
    await Promise.allSettled(captures);
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Feature check failed",
    );
    process.exit(1);
  });
