import { expect, it } from "vitest";
import { testModel } from "@/testing/fixtures/ai-model";
import {
  automaticModelProfile,
  hasAutomaticFreeAccess,
} from "../automatic-access";
import { DAY } from "../policy";

it("allows reviewed free models only after a fresh official catalog observation", () => {
  const now = Date.now();
  const model = {
    ...testModel(),
    provider: "ollama",
    upstreamModelId: "gpt-oss:20b",
    catalogCheckedAt: new Date(now),
    catalogMetadata: { sourceUrl: "https://ollama.com/api/tags" },
  };
  expect(hasAutomaticFreeAccess(model, now)).toBe(true);
  expect(
    hasAutomaticFreeAccess(
      { ...model, upstreamModelId: "unreviewed-paid-model" },
      now,
    ),
  ).toBe(false);
  expect(
    hasAutomaticFreeAccess(
      { ...model, catalogMetadata: { sourceUrl: "https://example.com" } },
      now,
    ),
  ).toBe(false);
  expect(
    hasAutomaticFreeAccess({ ...model, catalogCheckedAt: null }, now),
  ).toBe(false);
  expect(hasAutomaticFreeAccess(model, now + 9 * DAY)).toBe(false);
  expect(
    automaticModelProfile("google", "gemini-3.5-flash-lite")?.thinkingLevel,
  ).toBe("minimal");
});
