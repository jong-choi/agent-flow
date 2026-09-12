import { expect, it, vi } from "vitest";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";
import type { FlowNode } from "@/app/api/chat/_types/nodes";
import { listModelRegistry } from "@/lib/ai/registry-store";
import { testModel } from "@/testing/fixtures/ai-model";
import { availabilityMap } from "../state-store";

const { effect } = vi.hoisted(() => ({ effect: vi.fn(async () => ({})) }));
vi.mock("@/app/api/chat/_nodes", () => ({
  startNode: effect,
  documentNode: effect,
  chatNode: effect,
  endNode: effect,
}));
vi.mock("@/lib/ai/registry-store", () => ({ listModelRegistry: vi.fn() }));
vi.mock("../state-store", () => ({ availabilityMap: vi.fn() }));
it("rejects an unavailable downstream model before any graph side effect", async () => {
  const model = testModel();
  vi.mocked(listModelRegistry).mockResolvedValue([model]);
  vi.mocked(availabilityMap).mockResolvedValue(
    new Map([
      [model.id, { available: false, reason: "quota", nextProbeAt: null }],
    ]),
  );
  const nodes = ["startNode", "documentNode", "chatNode", "endNode"].map(
    (type, i) => ({
      id: String(i),
      type,
      data: { content: { value: model.id } },
    }),
  ) as FlowNode[];
  const app = buildStateGraph({
    nodes,
    edges: [
      { source: "0", target: "1" },
      { source: "1", target: "2" },
      { source: "2", target: "3" },
    ],
  }).compile();
  await expect(
    app.invoke({ initialInput: "test", messages: [] }),
  ).rejects.toThrow("Unavailable models");
  expect(effect).not.toHaveBeenCalled();
});
