import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import {
  HumanMessage,
  SystemMessage,
  mapStoredMessagesToChatMessages,
} from "@langchain/core/messages";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { createChatStream } from "../src/app/api/chat/_utils/create-chat-stream";
import { db } from "../src/db/client";
import { aiModels } from "../src/db/schema/ai-models";
import { createProviderModel } from "../src/lib/ai/adapters";
import { normalizeProviderError } from "../src/lib/ai/error";
import { runAiCall } from "../src/lib/ai/execution";
import { storeModelMessages, tagModelMessage } from "../src/lib/ai/history";
import { collectCatalog } from "../src/lib/ai/maintenance/collectors";
import { initialFreeCandidates } from "../src/lib/ai/maintenance/initial-candidates";
import { assertCompleteAnswer } from "../src/lib/ai/message";
import { initialCreditPolicy } from "../src/lib/ai/registry";
import { upsertCatalogModel } from "../src/lib/ai/registry-store";
import { captureNetwork } from "./lib/network-capture";

async function main() {
  assert.equal(
    process.env.RUN_AI_LIVE,
    "1",
    "Set RUN_AI_LIVE=1; calls are sequential",
  );
  assert.equal(
    new URL(process.env.DATABASE_URL!).hostname,
    "127.0.0.1",
    "Local DB only",
  );
  const directory = `.local/ai-captures/candidates-${Date.now()}`;
  const finish = await captureNetwork(directory);
  const save = (name: string, value: unknown) =>
    writeFile(
      `${directory}/${name}`,
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
      { mode: 0o600 },
    );
  const results = [];
  try {
    // Catalog requests and generation requests are all sequential as well.
    const google = await collectCatalog("google");
    const groq = await collectCatalog("groq");
    for (const profile of initialFreeCandidates) {
      if (
        process.env.AI_CANDIDATE_MODELS &&
        !process.env.AI_CANDIDATE_MODELS.split(",").includes(
          profile.upstreamModelId,
        )
      )
        continue;
      const catalog = profile.provider === "google" ? google : groq;
      assert.ok(
        catalog.modelIds.includes(profile.upstreamModelId),
        "Candidate missing from official API",
      );
      const row = await upsertCatalogModel(
        {
          provider: profile.provider,
          upstreamModelId: profile.upstreamModelId,
          displayName: profile.name,
          contextWindow: profile.contextWindow,
          metadata: {
            sourceUrl: profile.sourceUrl,
            outputTokenLimit: profile.outputTokenLimit,
            ...(profile.provider === "google"
              ? { inputTokenLimit: profile.contextWindow }
              : {}),
          },
        },
        {
          appMaxOutputTokens: 4096,
          metadata: { thinkingLevel: profile.thinkingLevel },
        },
      );
      if (row.lifecycle === "retired" || row.promotionBlocked) {
        results.push({ model: profile.upstreamModelId, status: "skipped" });
        continue;
      }
      const model = {
        ...row,
        appMaxOutputTokens: 512,
        metadata: { ...row.metadata, thinkingLevel: profile.thinkingLevel },
      };
      const llm = createProviderModel(model)!;
      try {
        const input = [
          new SystemMessage("한국어로 짧게 답해."),
          new HumanMessage("프로젝트 이름은 바다별이야. 기억해줘."),
        ];
        const first = await runAiCall(
          (signal) => llm.invoke(input, { signal }),
          { observe: { model, source: "probe" } },
        );
        const normalized = assertCompleteAnswer(first);
        assert.ok(!normalized.answer.includes("<think>"));
        await save(`${row.id}-invoke.json`, { message: first, normalized });
        const stored = storeModelMessages([tagModelMessage(first, model)]);
        const follow = [
          ...input,
          ...mapStoredMessagesToChatMessages(
            JSON.parse(JSON.stringify(stored)),
          ),
          new HumanMessage("프로젝트 이름이 뭐야? 이름만 답해."),
        ];
        const graph = new StateGraph(MessagesAnnotation)
          .addNode(
            "chat",
            async (state) => ({
              messages: [
                tagModelMessage(
                  await runAiCall(
                    (signal) => llm.invoke(state.messages, { signal }),
                    { observe: { model, source: "probe" } },
                  ),
                  model,
                ),
              ],
            }),
            { metadata: { type: "chatNode" } },
          )
          .addNode("end", async () => ({}), { metadata: { type: "endNode" } })
          .addEdge(START, "chat")
          .addEdge("chat", "end")
          .addEdge("end", END)
          .compile();
        let text = "",
          history = 0;
        const stream = createChatStream({
          signal: new AbortController().signal,
          events: (signal) =>
            graph.streamEvents({ messages: follow }, { version: "v2", signal }),
          onComplete: async (answer, messages) => {
            text = answer;
            history = messages.length;
          },
        });
        const raw = await new Response(stream).text();
        await save(`${row.id}-client.sse`, raw);
        const events = raw
          .trim()
          .split("\n\n")
          .map((line) => JSON.parse(line.slice(6)));
        assert.ok(!events.some((e) => e.error), "Stream failed");
        assert.equal(
          text,
          events
            .filter((e) => e.event === "on_chat_model_stream")
            .map((e) => e.chunk?.content || "")
            .join(""),
        );
        assert.ok(
          text.includes("바다별") && !text.includes("<think>") && history > 0,
        );
        // Only verified capability facts are updated. Never infer the account billing tier.
        await db
          .update(aiModels)
          .set({
            catalogMetadata: sql`${aiModels.catalogMetadata} || ${JSON.stringify({ capabilities: ["text", "streaming"], freeTierSourceUrl: profile.freeTierSourceUrl, compatibilityCheckedAt: new Date().toISOString() })}::jsonb`,
          })
          .where(eq(aiModels.id, row.id));
        if (row.lifecycle === "candidate") {
          await db
            .update(aiModels)
            .set({
              name: row.name === row.upstreamModelId ? profile.name : row.name,
              ...(profile.provider === "groq"
                ? {
                    appMaxOutputTokens: Math.min(
                      row.appMaxOutputTokens ?? 512,
                      512,
                    ),
                    requireFreeAccess: true,
                  }
                : {}),
              price:
                row.price ??
                initialCreditPolicy[
                  `${profile.provider}/${profile.upstreamModelId}`
                ],
              metadata: {
                ...row.metadata,
                thinkingLevel:
                  row.metadata?.thinkingLevel ?? profile.thinkingLevel,
              },
              ...(process.argv.includes("--activate-google") &&
              profile.provider === "google"
                ? { lifecycle: "active" as const, isActive: true }
                : {}),
            })
            .where(
              and(
                eq(aiModels.id, row.id),
                eq(aiModels.lifecycle, "candidate"),
                eq(aiModels.promotionBlocked, false),
              ),
            );
        }
        results.push({
          provider: profile.provider,
          model: profile.upstreamModelId,
          status: "passed",
          invoke: true,
          stream: true,
          signedHistory: true,
          answer: text,
          freeTierEligible: true,
          accountBillingVerified: false,
        });
        console.log(profile.upstreamModelId, "invoke/history/client SSE PASS");
      } catch (error) {
        results.push({
          model: profile.upstreamModelId,
          status: "failed",
          error: normalizeProviderError(error),
        });
        console.log(profile.upstreamModelId, "FAILED (see ignored report)");
      }
      await save("results.json", results);
    }
    console.log(`Raw and results: ${directory}`);
    assert.ok(
      results.length > 0 && results.every((r) => r.status === "passed"),
      "Candidate verification incomplete",
    );
  } finally {
    await finish();
  }
}
void main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error("Candidate verification failed; inspect .local captures");
    process.exit(1);
  });
