import { expect, it, vi } from "vitest";
import { collectCatalog } from "../collectors";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/ai/execution", () => ({
  aiFetch: request,
  runAiCall: (fn: (s: AbortSignal) => Promise<unknown>) =>
    fn(new AbortController().signal),
}));
vi.mock("../state-store", () => ({
  providerKeys: {
    google: "GOOGLE_AI_API_KEY",
    groq: "GROQ_API_KEY",
    ollama: "OLLAMA_API_KEY",
  },
}));
it("reads all Google pages and fails closed on incomplete/malformed pages", async () => {
  request.mockReset();
  request.mockResolvedValueOnce(
    Response.json({
      models: [
        { name: "models/a", supportedGenerationMethods: ["generateContent"] },
      ],
      nextPageToken: "next",
    }),
  );
  request.mockResolvedValueOnce(
    Response.json({
      models: [
        { name: "models/b", supportedGenerationMethods: ["countTokens"] },
      ],
    }),
  );
  const result = await collectCatalog("google");
  expect(result.modelIds).toEqual(["a", "b"]);
  expect(result.models.map((m) => m.upstreamModelId)).toEqual(["a"]);
  request.mockReset();
  request.mockResolvedValueOnce(
    Response.json({ models: [{ name: "models/a" }], nextPageToken: "next" }),
  );
  request.mockResolvedValueOnce(Response.json({ broken: true }));
  await expect(collectCatalog("google")).rejects.toThrow();
});
