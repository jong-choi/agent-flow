import { ChatGoogle } from "@langchain/google";
import { ChatOllama } from "@langchain/ollama";
import type { AiModel } from "@/db/schema/ai-models";
import { aiFetch } from "./execution";
import { CompatibleChatGroq } from "./groq";
import { getModelLimits } from "./registry";
import { resolveThinkingLevel } from "./thinking";

export { supportedThinkingLevels, type ThinkingLevel } from "./thinking";

function requireKey(name: string) {
  const key = process.env[name];
  if (!key) throw new Error(`${name} is required`);
  return key;
}
const builders = {
  google: (model: AiModel) => {
    const key = requireKey("GOOGLE_AI_API_KEY");
    const level = resolveThinkingLevel(model);
    return new ChatGoogle({
      model: model.upstreamModelId,
      maxRetries: 0,
      maxOutputTokens: getModelLimits(model).output,
      apiKey: key,
      platformType: "gai",
      apiVersion: "v1beta",
      ...(level === "default" ? {} : { thinkingLevel: level }),
      apiClient: {
        hasApiKey: () => true,
        getProjectId: async () => {
          throw new Error("This adapter uses the Gemini API, not Vertex AI");
        },
        fetch: (request: Request) => {
          request.headers.set("x-goog-api-key", key);
          return aiFetch(request);
        },
      },
    });
  },
  groq: (model: AiModel) => {
    const level = resolveThinkingLevel(model);
    const qwen = ["qwen/qwen3.6-27b", "qwen/qwen3.8-27b"].includes(
      model.upstreamModelId,
    );
    return new CompatibleChatGroq({
      model: model.upstreamModelId,
      apiKey: requireKey("GROQ_API_KEY"),
      maxTokens: getModelLimits(model).output,
      maxRetries: 0,
      // Qwen defaults to raw <think> content. Keep reasoning out of answer SSE/history.
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        if (!qwen) return aiFetch(input, init);
        // ChatGroq 1.0.4 fails to initialize reasoningFormat and has no reasoningEffort.
        const request = new Request(input, init);
        const body = await request.json();
        request.headers.delete("content-length");
        return aiFetch(
          new Request(request, {
            body: JSON.stringify({
              ...body,
              reasoning_format: "parsed",
              ...(level === "default"
                ? {}
                : { reasoning_effort: level === "minimal" ? "none" : level }),
            }),
          }),
        );
      },
    });
  },
  ollama: (model: AiModel) => {
    const level = resolveThinkingLevel(model);
    return new ChatOllama({
      model: model.upstreamModelId,
      baseUrl: "https://ollama.com",
      headers: { Authorization: `Bearer ${requireKey("OLLAMA_API_KEY")}` },
      numPredict: getModelLimits(model).output,
      maxRetries: 0,
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        if (level === "default") return aiFetch(input, init);
        // ChatOllama 1.3 types think as boolean, but GPT OSS requires string levels.
        const request = new Request(input, init);
        const body = await request.json();
        return aiFetch(
          new Request(request, {
            body: JSON.stringify({ ...body, think: level }),
          }),
        );
      },
    });
  },
};
export function createProviderModel(model: AiModel) {
  if (!(model.provider in builders)) return null;
  resolveThinkingLevel(model);
  return builders[model.provider as keyof typeof builders](model);
}
