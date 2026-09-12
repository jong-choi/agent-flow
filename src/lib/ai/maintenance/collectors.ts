import { z } from "zod";
import { aiFetch, runAiCall } from "../execution";
import type { CatalogModel } from "../registry-store";
import { providerKeys } from "./state-store";

export const providers = ["google", "groq", "ollama"] as const;
export function isChatCatalogModel(provider: string, id: string) {
  return provider === "google"
    ? !/tts|image|transcribe|lyria|robotics|computer-use|deep-research|antigravity/i.test(
        id,
      )
    : provider === "groq"
      ? !/whisper|tts|orpheus|guard|compound/i.test(id)
      : true;
}
export type Provider = (typeof providers)[number];
const googlePage = z.object({
  models: z.array(
    z.object({
      name: z.string().min(1),
      displayName: z.string().optional(),
      inputTokenLimit: z.number().int().positive().optional(),
      outputTokenLimit: z.number().int().positive().optional(),
      version: z.string().optional(),
      supportedGenerationMethods: z.array(z.string()).optional(),
      thinking: z.boolean().optional(),
    }),
  ),
  nextPageToken: z.string().optional(),
});
const groqPage = z.object({
  data: z.array(
    z.object({
      id: z.string().min(1),
      context_window: z.number().int().positive().optional(),
    }),
  ),
});
const ollamaPage = z.object({
  models: z.array(z.object({ model: z.string().min(1) })),
});
export interface CatalogSnapshot {
  provider: Provider;
  modelIds: string[];
  models: CatalogModel[];
  fetchedAt: number;
}
export async function collectCatalog(
  provider: Provider,
  signal?: AbortSignal,
): Promise<CatalogSnapshot> {
  const modelIds: string[] = [];
  const models: CatalogModel[] = [];
  let token: string | undefined;
  const seen = new Set<string>();
  do {
    const url = new URL(
      provider === "google"
        ? "https://generativelanguage.googleapis.com/v1beta/models"
        : provider === "groq"
          ? "https://api.groq.com/openai/v1/models"
          : "https://ollama.com/api/tags",
    );
    if (provider === "google") {
      url.searchParams.set("pageSize", "1000");
      if (token) url.searchParams.set("pageToken", token);
    }
    const data = await runAiCall(
      async (current) => {
        const key = process.env[providerKeys[provider]];
        const headers: Record<string, string> = {};
        if (provider === "google") headers["x-goog-api-key"] = key ?? "";
        if (provider === "groq") headers.Authorization = `Bearer ${key ?? ""}`;
        const r = await aiFetch(url, { signal: current, headers });
        if (!r.ok)
          throw Object.assign(new Error("Catalog request failed"), {
            status: r.status,
            headers: r.headers,
          });
        return r.json();
      },
      { signal, timeoutMs: 30000 },
    );
    if (provider === "google") {
      const page = googlePage.parse(data);
      for (const m of page.models) {
        const id = m.name.replace(/^models\//, "");
        modelIds.push(id);
        if (
          m.supportedGenerationMethods?.includes("generateContent") &&
          isChatCatalogModel(provider, id)
        )
          models.push({
            provider,
            upstreamModelId: id,
            displayName: m.displayName ?? id,
            metadata: {
              sourceUrl: url.origin + url.pathname,
              inputTokenLimit: m.inputTokenLimit,
              outputTokenLimit: m.outputTokenLimit,
              version: m.version,
              supportedGenerationMethods: m.supportedGenerationMethods,
            },
          });
      }
      token = page.nextPageToken;
      if (token) {
        if (seen.has(token)) throw Error("Repeated catalog page token");
        seen.add(token);
        if (seen.size > 100) throw Error("Catalog pagination exceeded bound");
      }
    } else if (provider === "groq") {
      const page = groqPage.parse(data);
      for (const m of page.data) {
        modelIds.push(m.id);
        if (isChatCatalogModel(provider, m.id))
          models.push({
            provider,
            upstreamModelId: m.id,
            displayName: m.id,
            contextWindow: m.context_window,
            metadata: { sourceUrl: url.origin + url.pathname },
          });
      }
      token = undefined;
    } else {
      const page = ollamaPage.parse(data);
      for (const m of page.models) {
        modelIds.push(m.model);
        models.push({
          provider,
          upstreamModelId: m.model,
          displayName: m.model,
          metadata: { sourceUrl: url.origin + url.pathname },
        });
      }
      token = undefined;
    }
  } while (token);
  if (new Set(modelIds).size !== modelIds.length)
    throw Error("Duplicate catalog model IDs");
  return { provider, modelIds, models, fetchedAt: Date.now() };
}
