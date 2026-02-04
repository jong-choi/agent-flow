import { describe, expect, it } from "vitest";
import { type Edge } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import {
  buildImportedPresetGraph,
  computePresetImportOffset,
} from "@/features/canvas/utils/preset-import-graph";

const createNode = (id: string, x: number, y: number): FlowCanvasNode =>
  ({
    id,
    type: "promptNode",
    position: { x, y },
    data: {
      label: id,
      description: "",
      content: null,
      handle: null,
      information: null,
    },
  }) as FlowCanvasNode;

describe("preset-import-graph", () => {
  describe("computePresetImportOffset", () => {
    it("기존 캔버스가 비어있으면 preset의 minX/minY를 0으로 맞춘다", () => {
      const presetNodes = [
        createNode("a", 100, 200),
        createNode("b", 150, 250),
      ];

      const offset = computePresetImportOffset({
        existingNodes: [],
        presetNodes,
      });

      expect(offset).toEqual({ x: -100, y: -200 });
    });

    it("기존 캔버스가 있으면 오른쪽으로 띄워서 추가한다", () => {
      const existingNodes = [
        createNode("x", 300, 50),
        createNode("y", 400, 200),
      ];
      const presetNodes = [
        createNode("a", 100, 200),
        createNode("b", 150, 250),
      ];

      const offset = computePresetImportOffset({
        existingNodes,
        presetNodes,
        gapX: 320,
      });

      expect(offset).toEqual({ x: 620, y: -150 });
    });
  });

  describe("buildImportedPresetGraph", () => {
    it("노드/엣지 id를 재매핑하고, 누락된 노드를 참조하는 엣지는 제거한다", () => {
      const nodes = [createNode("a", 10, 20), createNode("b", 30, 40)];
      const edges: Edge[] = [
        { id: "e0", source: "a", target: "b" },
        { id: "e1", source: "a", target: "missing" },
      ];

      const ids = ["edge-1", "edge-2"];
      const createEdgeId = () => ids.shift() ?? "edge-x";

      const imported = buildImportedPresetGraph({
        presetId: "p1",
        instanceId: "i1",
        nodes,
        edges,
        offset: { x: 5, y: -5 },
        createEdgeId,
      });

      expect(imported.nodes.map((node) => node.id)).toEqual([
        "preset:p1:i1:a",
        "preset:p1:i1:b",
      ]);
      expect(imported.nodes.map((node) => node.position)).toEqual([
        { x: 15, y: 15 },
        { x: 35, y: 35 },
      ]);

      expect(imported.edges).toHaveLength(1);
      expect(imported.edges[0]).toMatchObject({
        id: "edge-1",
        source: "preset:p1:i1:a",
        target: "preset:p1:i1:b",
      });
    });
  });
});
