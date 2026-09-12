import type { AiModel } from "@/db/schema/ai-models";

export type ThinkingLevel = "default" | "minimal" | "low" | "medium" | "high";
export function supportedThinkingLevels(
  provider: string,
  model: string,
): ThinkingLevel[] {
  if (
    provider === "google" &&
    ["gemma-4-26b-a4b-it", "gemma-4-31b-it"].includes(model)
  )
    return ["default", "minimal", "high"];
  if (provider === "google" && model === "gemini-3.5-flash-lite")
    return ["default", "minimal", "low", "medium", "high"];
  if (provider === "ollama" && model.startsWith("gpt-oss:"))
    return ["default", "low", "medium", "high"];
  return ["default"];
}
export function resolveThinkingLevel(model: AiModel): ThinkingLevel {
  const level = model.metadata?.thinkingLevel ?? "default";
  if (
    !supportedThinkingLevels(model.provider, model.upstreamModelId).includes(
      level,
    )
  )
    throw new Error(
      `Unsupported thinking level for ${model.provider}/${model.upstreamModelId}`,
    );
  return level;
}
