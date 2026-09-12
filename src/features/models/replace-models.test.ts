import { expect, it } from "vitest";
import type { FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { replaceModelReferences } from "./replace-models";

it("replaces UUID/legacy chat references without touching other node content or layout", () => {
  const nodes = [
    {
      id: "a",
      type: "chatNode",
      position: { x: 1, y: 2 },
      data: { content: { value: "old" } },
    },
    {
      id: "b",
      type: "chatNode",
      position: { x: 3, y: 4 },
      data: { content: { value: "uuid" } },
    },
    {
      id: "c",
      type: "promptNode",
      position: { x: 5, y: 6 },
      data: { content: { value: "old" } },
    },
  ] as FlowCanvasNode[];
  const changed = replaceModelReferences(nodes, "uuid", "next", [
    { id: "uuid", value: "uuid", legacyValue: "old" },
  ]);
  expect(changed.map((n) => n.data.content?.value)).toEqual([
    "next",
    "next",
    "old",
  ]);
  expect(changed[2]).toBe(nodes[2]);
  expect(changed[0].position).toBe(nodes[0].position);
  expect(nodes[0].data.content?.value).toBe("old");
});
