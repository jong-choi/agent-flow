import { describe, expect, it } from "vitest";
import type { AiModel } from "@/db/schema/ai-models";
import {
  estimateModelCredits,
  findModelByReference,
  getModelLimits,
  initialCreditPolicy,
  isSelectableModel,
  toModelOption,
} from "../registry";

const model: AiModel = {
  id: "11111111-1111-4111-8111-111111111111",
  modelId: "old-id",
  upstreamModelId: "shared-id",
  provider: "groq",
  name: "Operator name",
  description: null,
  replacementModelId: null,
  retirementAt: null,
  retirementReason: null,
  retirementSourceUrl: null,
  promotionBlocked: false,
  requireFreeAccess: false,
  order: 1,
  price: 15,
  isActive: true,
  lifecycle: "active",
  entitlement: "unknown",
  health: "healthy",
  contextWindow: 131072,
  catalogMetadata: { outputTokenLimit: 65536 },
  catalogCheckedAt: null,
  appMaxInputTokens: 8000,
  appMaxOutputTokens: 4096,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
describe("model registry policy", () => {
  it("resolves both saved aliases and new UUID references without merging providers", () => {
    const other = {
      ...model,
      id: "22222222-2222-4222-8222-222222222222",
      modelId: "other-alias",
      provider: "ollama",
    };
    expect(findModelByReference([model, other], "old-id")?.id).toBe(model.id);
    expect(findModelByReference([model, other], other.id)?.provider).toBe(
      "ollama",
    );
    expect(findModelByReference([model, other], "shared-id")).toBeNull();
  });
  it.each([
    { lifecycle: "retired" },
    { lifecycle: "candidate" },
    { health: "cooldown" },
    { entitlement: "blocked" },
    { isActive: false },
    { price: null },
  ])("keeps unavailable references visible but not selectable: %j", (patch) => {
    const item = { ...model, ...patch } as AiModel;
    expect(toModelOption(item).value).toBe(model.id);
    expect(isSelectableModel(item)).toBe(false);
    expect(estimateModelCredits([item], [item.id])).toBeNull();
  });
  it("unknown models are not silently priced as free; explicit zero is allowed", () => {
    expect(estimateModelCredits([model], [model.id, "missing"])).toBeNull();
    expect(estimateModelCredits([{ ...model, price: 0 }], [model.id])).toBe(0);
    expect(estimateModelCredits([model], [model.id, "old-id"])).toBe(30);
  });
  it("keeps app limits distinct from provider maximums and caps them", () => {
    expect(getModelLimits(model)).toEqual({ input: 8000, output: 4096 });
    expect(
      getModelLimits({
        ...model,
        catalogMetadata: { inputTokenLimit: 2000, outputTokenLimit: 1000 },
      }),
    ).toEqual({ input: 2000, output: 1000 });
  });
  it("keeps Groq prices while giving new Ollama candidates lower initial prices", () => {
    expect(initialCreditPolicy["groq/openai/gpt-oss-20b"]).toBe(15);
    expect(initialCreditPolicy["groq/openai/gpt-oss-120b"]).toBe(20);
    expect(initialCreditPolicy["ollama/gpt-oss:20b"]).toBe(2);
    expect(initialCreditPolicy["ollama/gpt-oss:120b"]).toBe(4);
  });
});
