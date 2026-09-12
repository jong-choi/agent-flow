import "dotenv/config";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
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
import { aiFetch, runAiCall } from "../src/lib/ai/execution";
import { storeModelMessages, tagModelMessage } from "../src/lib/ai/history";
import { getAnswerText, getModelResponse } from "../src/lib/ai/message";
import { initialProviderModels } from "../src/lib/ai/onboarding";
import {
  listModelRegistry,
  updateModelSettings,
  upsertCatalogModel,
} from "../src/lib/ai/registry-store";

async function main() {
  assert.equal(
    process.env.RUN_AI_LIVE,
    "1",
    "Set RUN_AI_LIVE=1 for sequential live verification",
  );
  assert.equal(
    new URL(process.env.DATABASE_URL!).hostname,
    "127.0.0.1",
    "Only local DB activation is allowed",
  );
  const activate = process.argv.includes("--activate");
  const directory = `.local/ai-captures/onboarding-${Date.now()}`;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  let counter = 0;
  let pending: Promise<void>[] = [];
  const save = async (name: string, value: unknown) =>
    writeFile(
      `${directory}/${name}`,
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
      { mode: 0o600 },
    );
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const name = String(++counter);
    const url = new URL(request.url);
    url.searchParams.delete("key");
    await save(`${name}-request.json`, {
      url: url.toString(),
      body: await request.clone().text(),
    });
    const response = await nativeFetch(request);
    const captured = response
      .clone()
      .text()
      .then(async (body) => {
        await save(`${name}-response.raw`, body);
        await save(`${name}-http.json`, {
          status: response.status,
          contentType: response.headers.get("content-type"),
        });
      });
    pending.push(captured);
    void captured.catch(() => {});
    return response;
  };
  const results = [];
  try {
    const googleList = [];
    let pageToken: string | undefined;
    do {
      const url = new URL(
        "https://generativelanguage.googleapis.com/v1beta/models",
      );
      url.searchParams.set("pageSize", "1000");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const data = await runAiCall(async (signal) => {
        const r = await aiFetch(url, {
          signal,
          headers: { "x-goog-api-key": process.env.GOOGLE_AI_API_KEY! },
        });
        if (!r.ok) throw Error(`Google catalog HTTP ${r.status}`);
        return r.json();
      });
      googleList.push(...data.models);
      pageToken = data.nextPageToken;
    } while (pageToken);
    const ollamaList = await runAiCall(async (signal) => {
      const r = await aiFetch("https://ollama.com/api/tags", { signal });
      if (!r.ok) throw Error(`Ollama catalog HTTP ${r.status}`);
      return r.json();
    });
    for (const profile of initialProviderModels) {
      pending = [];
      const facts =
        profile.provider === "google"
          ? googleList.find(
              (m) => m.name === `models/${profile.upstreamModelId}`,
            )
          : ollamaList.models.find(
              (m: { model: string }) => m.model === profile.upstreamModelId,
            );
      const model = await upsertCatalogModel(
        {
          provider: profile.provider,
          upstreamModelId: profile.upstreamModelId,
          displayName: profile.name,
          metadata: {
            sourceUrl:
              profile.provider === "google"
                ? "https://ai.google.dev/api/models"
                : "https://ollama.com/api/tags",
            ...(profile.provider === "google" && facts
              ? {
                  inputTokenLimit: facts.inputTokenLimit,
                  outputTokenLimit: facts.outputTokenLimit,
                  version: facts.version,
                  capabilities: [
                    "text",
                    "streaming",
                    ...(facts.thinking ? ["thinking"] : []),
                  ],
                }
              : {}),
          },
        },
        {
          appMaxOutputTokens: 4096,
          metadata: {
            thinkingLevel: profile.thinkingLevel,
            ...(profile.titlePriority !== undefined
              ? { titlePriority: profile.titlePriority }
              : {}),
          },
        },
      );
      if (model.lifecycle === "retired") {
        results.push({ id: model.id, ...profile, status: "skipped-retired" });
        continue;
      }
      try {
        assert.ok(facts, "Model is absent from the official catalog");
        const llm = createProviderModel(model)!;
        const input = [
          new SystemMessage("한국어로 짧게 답해."),
          new HumanMessage("프로젝트 이름은 바다별이야. 기억해줘."),
        ];
        const first = await runAiCall((signal) =>
          llm.invoke(input, { signal }),
        );
        assert.ok(getAnswerText(first.content).trim());
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
                  await runAiCall((signal) =>
                    llm.invoke(state.messages, { signal }),
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
        let finalText = "";
        let history = 0;
        const stream = createChatStream({
          signal: new AbortController().signal,
          events: (signal) =>
            graph.streamEvents({ messages: follow }, { version: "v2", signal }),
          onComplete: async (text, messages) => {
            finalText = text;
            history = messages.length;
          },
        });
        const raw = await new Response(stream).text();
        await save(`${model.id}-client.sse`, raw);
        const events = raw
          .trim()
          .split("\n\n")
          .map((line) => JSON.parse(line.slice(6)));
        assert.ok(!events.some((e) => e.error));
        const text = events
          .filter((e) => e.event === "on_chat_model_stream")
          .map((e) => e.chunk?.content || "")
          .join("");
        assert.equal(text, finalText);
        assert.ok(text.includes("바다별"));
        assert.ok(history > 0);
        await save(`${model.id}-invoke.json`, {
          message: first,
          normalized: getModelResponse(first),
        });
        if (
          activate &&
          model.lifecycle === "candidate" &&
          !model.promotionBlocked
        )
          await db
            .update(aiModels)
            .set({ lifecycle: "active", isActive: true, updatedAt: new Date() })
            .where(eq(aiModels.id, model.id));
        results.push({
          id: model.id,
          ...profile,
          status: "passed",
          activated:
            activate &&
            model.lifecycle === "candidate" &&
            !model.promotionBlocked,
          historyMessages: history,
        });
        console.log(
          `${profile.provider}/${profile.upstreamModelId}: invoke, signed history, stream contract PASS`,
        );
      } catch (error) {
        const detail = normalizeProviderError(error);
        results.push({
          id: model.id,
          ...profile,
          status: "pending",
          error: detail,
        });
        console.log(
          `${profile.provider}/${profile.upstreamModelId}: pending (${detail.status ?? detail.category})`,
        );
      }
      await Promise.allSettled(pending);
    }
    const fallback = (await listModelRegistry()).find(
      (m) =>
        m.provider === "groq" && m.upstreamModelId === "openai/gpt-oss-20b",
    );
    if (activate && fallback && fallback.metadata?.titlePriority === undefined)
      await updateModelSettings(fallback.id, {
        metadata: { titlePriority: 100 },
      });
    await save("results.json", results);
    console.log(`Saved ${directory}`);
  } finally {
    globalThis.fetch = nativeFetch;
    await Promise.allSettled(pending);
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Onboarding failed");
    process.exit(1);
  });
