import type { ThinkingLevel } from "../thinking";

/** Reviewed official free-tier eligibility, NOT proof of this credential's billing tier.
 * Discovery keeps these candidates private until account policy and live checks pass.
 */
export const initialFreeCandidates: {
  provider: "google" | "groq";
  upstreamModelId: string;
  name: string;
  thinkingLevel: ThinkingLevel;
  contextWindow: number;
  outputTokenLimit: number;
  sourceUrl: string;
  freeTierSourceUrl: string;
  preview: boolean;
}[] = [
  {
    provider: "google",
    upstreamModelId: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    thinkingLevel: "minimal",
    contextWindow: 1048576,
    outputTokenLimit: 65536,
    sourceUrl:
      "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite",
    freeTierSourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    preview: false,
  },
  ...(["3.6", "3.8"] as const).map((version) => ({
    provider: "groq" as const,
    upstreamModelId: `qwen/qwen${version}-27b`,
    name: `Qwen ${version} 27B`,
    thinkingLevel: "minimal" as const,
    // The 3.8 official card currently states 131,042 (not 131,072).
    contextWindow: version === "3.6" ? 131072 : 131042,
    outputTokenLimit: 16384,
    sourceUrl: `https://console.groq.com/docs/model/qwen/qwen${version}-27b`,
    freeTierSourceUrl: "https://console.groq.com/docs/rate-limits",
    preview: true,
  })),
];
