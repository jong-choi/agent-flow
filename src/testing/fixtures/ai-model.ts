import type { AiModel } from "@/db/schema/ai-models";

export function testModel(overrides: Partial<AiModel> = {}): AiModel {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    modelId: "legacy-id",
    upstreamModelId: "gemini-3.5-flash-lite",
    provider: "google",
    name: "Test model",
    description: null,
    order: 1,
    price: 2,
    isActive: true,
    lifecycle: "active",
    entitlement: "unknown",
    health: "healthy",
    contextWindow: null,
    catalogMetadata: {},
    catalogCheckedAt: null,
    appMaxInputTokens: 8000,
    appMaxOutputTokens: 1024,
    metadata: { thinkingLevel: "minimal" },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
