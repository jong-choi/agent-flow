import type { AiModel } from "@/db/schema/ai-models";

export function isSelectableModel(model: AiModel) {
  return (
    model.isActive &&
    ["active", "deprecated"].includes(model.lifecycle) &&
    ["healthy", "probing"].includes(model.health) &&
    model.entitlement !== "blocked" &&
    (!model.requireFreeAccess || model.entitlement === "free_confirmed") &&
    model.price !== null &&
    model.price >= 0
  );
}
export function findModelByReference(models: AiModel[], reference: string) {
  return (
    models.find((model) => model.id === reference) ??
    models.find((model) => model.modelId === reference) ??
    null
  );
}
export function getModelLimits(model: AiModel) {
  const configuredOutput =
    model.appMaxOutputTokens ?? model.metadata?.maxOutputTokens ?? 8192;
  return {
    input: Math.min(
      model.appMaxInputTokens,
      model.catalogMetadata.inputTokenLimit ?? Infinity,
    ),
    output: Math.min(
      configuredOutput,
      model.catalogMetadata.outputTokenLimit ?? Infinity,
    ),
  };
}
export function toModelOption(model: AiModel) {
  const limits = getModelLimits(model);
  return {
    id: model.id,
    value: model.id,
    legacyValue: model.modelId,
    label: model.name,
    provider: model.provider,
    upstreamModelId: model.upstreamModelId,
    description: model.description ?? undefined,
    thinkingLevel: model.metadata?.thinkingLevel ?? "default",
    price: model.price,
    selectable: isSelectableModel(model),
    lifecycle: model.lifecycle,
    health: model.health,
    replacementModelId: model.replacementModelId,
    retirementReason: model.retirementReason,
    inputLimit: limits.input,
    outputLimit: limits.output,
    contextWindow: model.contextWindow,
    capabilities: model.catalogMetadata.capabilities ?? [],
  };
}
export function estimateModelCredits(
  models: AiModel[],
  references: (string | null)[],
): number | null {
  let total = 0;
  for (const reference of references) {
    const model = reference ? findModelByReference(models, reference) : null;
    if (!model || !isSelectableModel(model)) return null;
    total += model.price!;
  }
  return total;
}
export const initialCreditPolicy: Record<string, number> = {
  "groq/openai/gpt-oss-20b": 15,
  "groq/openai/gpt-oss-120b": 20,
  "ollama/gpt-oss:20b": 2,
  "ollama/gpt-oss:120b": 4,
  "ollama/gemma4:31b": 3,
  "google/gemma-4-26b-a4b-it": 2,
  "google/gemma-4-31b-it": 3,
  "google/gemini-3.5-flash-lite": 5,
  "google/gemini-3.1-flash-lite": 4,
  "groq/qwen/qwen3.6-27b": 15,
  "groq/qwen/qwen3.8-27b": 20,
};
