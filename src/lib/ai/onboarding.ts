import type { ThinkingLevel } from "./adapters";

export const initialProviderModels: {
  provider: "google" | "ollama";
  upstreamModelId: string;
  name: string;
  thinkingLevel: ThinkingLevel;
  titlePriority?: number;
}[] = [
  {
    provider: "google",
    upstreamModelId: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    thinkingLevel: "minimal",
    titlePriority: 20,
  },
  {
    provider: "google",
    upstreamModelId: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    thinkingLevel: "minimal",
    titlePriority: 10,
  },
  {
    provider: "google",
    upstreamModelId: "gemma-4-26b-a4b-it",
    name: "Gemma 4 26B A4B",
    thinkingLevel: "minimal",
  },
  {
    provider: "google",
    upstreamModelId: "gemma-4-31b-it",
    name: "Gemma 4 31B",
    thinkingLevel: "minimal",
  },
  {
    provider: "ollama",
    upstreamModelId: "gpt-oss:20b",
    name: "GPT OSS 20B",
    thinkingLevel: "low",
    titlePriority: 30,
  },
  {
    provider: "ollama",
    upstreamModelId: "gpt-oss:120b",
    name: "GPT OSS 120B",
    thinkingLevel: "low",
  },
  {
    provider: "ollama",
    upstreamModelId: "gemma4:31b",
    name: "Gemma 4 31B",
    thinkingLevel: "default",
  },
];
