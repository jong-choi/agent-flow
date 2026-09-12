/** Explicit, sequential Groq regression check through the production adapter. */
import "dotenv/config";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import {
  AIMessage,
  type AIMessageChunk,
  HumanMessage,
} from "@langchain/core/messages";
import { createProviderModel } from "../src/lib/ai/adapters";
import { runAiCall } from "../src/lib/ai/execution";
import { assertCompleteAnswer } from "../src/lib/ai/message";
import { listModelRegistry } from "../src/lib/ai/registry-store";
import { captureNetwork } from "./lib/network-capture";

async function main() {
  assert.equal(
    process.env.RUN_AI_LIVE,
    "1",
    "Set RUN_AI_LIVE=1 for real sequential requests",
  );
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "127.0.0.1");
  const directory = `.local/ai-captures/groq-release-${Date.now()}`;
  const finish = await captureNetwork(directory);
  try {
    const registry = await listModelRegistry();
    const report = [];
    for (const upstreamModelId of [
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
    ]) {
      const row = registry.find(
        (m) => m.provider === "groq" && m.upstreamModelId === upstreamModelId,
      );
      assert.ok(row);
      const model = { ...row, appMaxOutputTokens: 512 };
      const llm = createProviderModel(model)!;
      const input = [
        new HumanMessage("프로젝트 이름은 바다별이야. 이름만 답해."),
      ];
      const first = await runAiCall((signal) => llm.invoke(input, { signal }), {
        observe: { model, source: "probe" },
      });
      const normalized = assertCompleteAnswer(first);
      assert.equal(normalized.finishReason, "stop");
      const chunks: AIMessageChunk[] = [];
      const response = await runAiCall(
        async (signal) => {
          for await (const chunk of await llm.stream(
            [
              ...input,
              new AIMessage(normalized.answer),
              new HumanMessage("프로젝트 이름이 뭐야? 이름만 답해."),
            ],
            { signal },
          ))
            chunks.push(chunk);
          assert.ok(chunks.length);
          return chunks.reduce((a, b) => a.concat(b));
        },
        { observe: { model, source: "probe" } },
      );
      const streamed = assertCompleteAnswer(response);
      assert.equal(streamed.finishReason, "stop");
      assert.ok(streamed.answer.includes("바다별"));
      await writeFile(
        `${directory}/${row.id}.json`,
        JSON.stringify(
          { first, normalized, chunks, response, streamed },
          null,
          2,
        ),
        { mode: 0o600 },
      );
      report.push({
        upstreamModelId,
        invoke: true,
        stream: true,
        history: true,
        finishReason: streamed.finishReason,
      });
      console.log(upstreamModelId, "invoke/stream/history/finish PASS");
    }
    await writeFile(
      `${directory}/results.json`,
      JSON.stringify(report, null, 2),
      { mode: 0o600 },
    );
    console.log(`Raw saved in ${directory}`);
  } finally {
    await finish();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.name);
    process.exit(1);
  });
