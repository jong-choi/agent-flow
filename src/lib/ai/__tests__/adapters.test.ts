// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { testModel } from "@/testing/fixtures/ai-model";
import { createProviderModel } from "../adapters";
import { selectTitleModel } from "../title-policy";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("@/lib/ai/execution", () => ({ aiFetch: fetchMock }));
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubEnv("GOOGLE_AI_API_KEY", "fixture-google");
  vi.stubEnv("OLLAMA_API_KEY", "fixture-ollama");
  vi.stubEnv("GROQ_API_KEY", "fixture-groq");
});
it.each(["qwen/qwen3.6-27b", "qwen/qwen3.8-27b"])(
  "separates %s reasoning from answers and maps minimal to none",
  async (upstreamModelId) => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "fixture",
          object: "chat.completion",
          created: 1,
          model: upstreamModelId,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "answer",
                reasoning: "private trace",
              },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    const result = await createProviderModel(
      testModel({
        provider: "groq",
        upstreamModelId,
        metadata: { thinkingLevel: "minimal" },
      }),
    )!.invoke("hello");
    expect(result.content).toBe("answer");
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(await req.json()).toMatchObject({
      reasoning_format: "parsed",
      reasoning_effort: "none",
    });
  },
);
afterEach(() => vi.unstubAllEnvs());
it("sends Google thinking config and auth through the shared transport", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: { role: "model", parts: [{ text: "정답" }] },
            finishReason: "STOP",
          },
        ],
        usageMetadata: {
          promptTokenCount: 2,
          candidatesTokenCount: 2,
          totalTokenCount: 4,
        },
      }),
      { headers: { "content-type": "application/json" } },
    ),
  );
  const result = await createProviderModel(testModel())!.invoke("hello");
  expect(result.content).toBe("정답");
  const req = fetchMock.mock.calls[0][0] as Request;
  expect(req.url).toContain(
    "generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
  );
  expect(req.headers.get("x-goog-api-key")).toBe("fixture-google");
  expect((await req.json()).generationConfig.thinkingConfig).toMatchObject({
    thinkingLevel: "MINIMAL",
    includeThoughts: false,
  });
});
it("sends GPT OSS string levels instead of ignored booleans", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        model: "gpt-oss:20b",
        message: { role: "assistant", content: "answer", thinking: "trace" },
        done: true,
        done_reason: "stop",
        prompt_eval_count: 2,
        eval_count: 3,
      }) + "\n",
      { headers: { "content-type": "application/x-ndjson" } },
    ),
  );
  const model = createProviderModel(
    testModel({
      provider: "ollama",
      upstreamModelId: "gpt-oss:20b",
      metadata: { thinkingLevel: "low" },
    }),
  )!;
  const result = await model.invoke("hello");
  expect(result.content).toBe("answer");
  expect(result.additional_kwargs.reasoning_content).toBe("trace");
  const req = fetchMock.mock.calls[0][0] as Request;
  expect(req.headers.get("Authorization")).toBe("Bearer fixture-ollama");
  expect((await req.json()).think).toBe("low");
});
it("rejects unsupported reasoning settings before sending a request", () => {
  expect(() =>
    createProviderModel(
      testModel({
        upstreamModelId: "gemma-4-26b-a4b-it",
        metadata: { thinkingLevel: "medium" },
      }),
    ),
  ).toThrow("Unsupported thinking");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("chooses an explicitly configured, available title model", () => {
  const a = testModel({ metadata: { titlePriority: 10 } }),
    b = testModel({
      id: "22222222-2222-4222-8222-222222222222",
      metadata: { titlePriority: 20 },
    });
  expect(selectTitleModel([b, a])?.id).toBe(a.id);
  expect(selectTitleModel([{ ...a, isActive: false }, b])?.id).toBe(b.id);
  expect(selectTitleModel([testModel({ metadata: {} })])).toBeNull();
});
it("retains Groq stream truncation metadata on message chunks", async () => {
  const data = [
    {
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: "partial" },
          finish_reason: null,
        },
      ],
    },
    { choices: [{ index: 0, delta: {}, finish_reason: "length" }] },
    {
      choices: [],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  ];
  fetchMock.mockResolvedValue(
    new Response(
      data
        .map(
          (d) =>
            `data: ${JSON.stringify({ id: "fixture", model: "openai/gpt-oss-20b", ...d })}\n\n`,
        )
        .join("") + "data: [DONE]\n\n",
      { headers: { "content-type": "text/event-stream" } },
    ),
  );
  const model = createProviderModel(
    testModel({
      provider: "groq",
      upstreamModelId: "openai/gpt-oss-20b",
      metadata: {},
    }),
  )!;
  const chunks = [];
  for await (const chunk of await model.stream("hello")) chunks.push(chunk);
  const combined = chunks.reduce((a, b) => a.concat(b));
  expect(combined.response_metadata.finish_reason).toBe("length");
});
