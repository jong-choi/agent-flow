import { describe, expect, it } from "vitest";
import { type Edge } from "@xyflow/react";
import {
  handleCountRefine,
  pruneEdgesForHandleCount,
} from "@/features/canvas/utils/canvas-node-panel";

describe("pruneEdgesForHandleCount - edges 압축 중심", () => {
  describe("target 기준 압축", () => {
    it("관련 target 엣지가 없으면 shouldUpdate 없이 원본을 그대로 반환한다", () => {
      // 입력값:
      //   x --s0--> y(t0)
      //   u --s1--> v(t1)
      // 기댓값:
      //   x --s0--> y(t0)
      //   u --s1--> v(t1)
      const edges: Edge[] = [
        {
          id: "외부-1",
          source: "x",
          target: "y",
          sourceHandle: "s0",
          targetHandle: "t0",
        },
        {
          id: "외부-2",
          source: "u",
          target: "v",
          sourceHandle: "s1",
          targetHandle: "t1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "target",
        nextCount: 2,
      });

      expect(result.shouldUpdate).toBe(false);
      expect(result.nextEdges).toEqual(edges);
    });

    it("nextCount보다 많은 target 엣지를 낮은 인덱스 순으로 남기고 핸들을 0부터 재배열한다", () => {
      // 입력값:
      //   a --s1--> node(target-0)
      //   b --s2--> node(target-2)
      //   c --s3--> node(target-4)
      //   x --s0--> y(t0)
      // 기댓값:
      //   a --s1--> node(target0)
      //   b --s2--> node(target1)
      //   x --s0--> y(t0)
      const edges: Edge[] = [
        {
          id: "외부-1",
          source: "x",
          target: "y",
          sourceHandle: "s0",
          targetHandle: "t0",
        },
        {
          id: "keep-0",
          source: "a",
          target: "node",
          sourceHandle: "s1",
          targetHandle: "target-0",
        },
        {
          id: "keep-2",
          source: "b",
          target: "node",
          sourceHandle: "s2",
          targetHandle: "target-2",
        },
        {
          id: "drop-4",
          source: "c",
          target: "node",
          sourceHandle: "s3",
          targetHandle: "target-4",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "target",
        nextCount: 2,
      });

      expect(result.shouldUpdate).toBe(true);
      expect(result.nextEdges.map((edge) => edge.id)).toEqual([
        "외부-1",
        "keep-0",
        "keep-2",
      ]);
      const related = result.nextEdges.filter((edge) => edge.target === "node");
      expect(related.map((edge) => edge.targetHandle)).toEqual([
        "target0",
        "target1",
      ]);
    });

    it("중간 인덱스가 비어 있으면 삭제 없이 압축만 수행한다", () => {
      // 입력값:
      //   a --s1--> node(target-1)
      //   b --s2--> node(target-3)
      //   u1 --s0--> v1(t0), u2 --s3--> v2(t1)
      // 기댓값:
      //   a --s1--> node(target0)
      //   b --s2--> node(target1)
      //   u1 --s0--> v1(t0), u2 --s3--> v2(t1)
      const edges: Edge[] = [
        {
          id: "외부-1",
          source: "u1",
          target: "v1",
          sourceHandle: "s0",
          targetHandle: "t0",
        },
        {
          id: "gap-1",
          source: "a",
          target: "node",
          sourceHandle: "s1",
          targetHandle: "target-1",
        },
        {
          id: "gap-3",
          source: "b",
          target: "node",
          sourceHandle: "s2",
          targetHandle: "target-3",
        },
        {
          id: "외부-2",
          source: "u2",
          target: "v2",
          sourceHandle: "s3",
          targetHandle: "t1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "target",
        nextCount: 3,
      });

      expect(result.shouldUpdate).toBe(true);
      expect(result.nextEdges.map((edge) => edge.id)).toEqual([
        "외부-1",
        "외부-2",
        "gap-1",
        "gap-3",
      ]);
      const handles = result.nextEdges
        .filter((edge) => edge.target === "node")
        .map((edge) => edge.targetHandle);
      expect(handles).toEqual(["target0", "target1"]);
    });

    it("이미 연속된 target 핸들이고 nextCount가 충분하면 변경이 없다", () => {
      // 입력값:
      //   a --s1--> node(target0)
      //   b --s2--> node(target1)
      //   x --s0--> y(t0)
      // 기댓값:
      //   a --s1--> node(target0)
      //   b --s2--> node(target1)
      //   x --s0--> y(t0)
      const edges: Edge[] = [
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "s0",
          targetHandle: "t0",
        },
        {
          id: "t0",
          source: "a",
          target: "node",
          sourceHandle: "s1",
          targetHandle: "target0",
        },
        {
          id: "t1",
          source: "b",
          target: "node",
          sourceHandle: "s2",
          targetHandle: "target1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "target",
        nextCount: 3,
      });

      expect(result.shouldUpdate).toBe(false);
      expect(result.nextEdges).toEqual(edges);
    });
  });

  describe("source 기준 압축", () => {
    it("이미 연속된 source 핸들이고 nextCount가 충분하면 shouldUpdate가 false이다", () => {
      // 입력값:
      //   node(source0) --t1--> a
      //   node(source1) --t2--> b
      //   x --s0--> y(t0)
      // 기댓값:
      //   node(source0) --t1--> a
      //   node(source1) --t2--> b
      //   x --s0--> y(t0)
      const edges: Edge[] = [
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "s0",
          targetHandle: "t0",
        },
        {
          id: "s0",
          source: "node",
          target: "a",
          sourceHandle: "source0",
          targetHandle: "t1",
        },
        {
          id: "s1",
          source: "node",
          target: "b",
          sourceHandle: "source1",
          targetHandle: "t2",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "source",
        nextCount: 3,
      });

      expect(result.shouldUpdate).toBe(false);
      expect(result.nextEdges).toEqual(edges);
    });

    it("nextCount보다 많은 source 엣지를 낮은 인덱스 순으로 남기고 핸들을 0부터 재배열한다", () => {
      // 입력값:
      //   node(source-3) -> a, node(source-0) -> b, node(source-1) -> c
      //   p -> q, r -> s (외부)
      // 기댓값:
      //   node(source0) -> b, node(source1) -> c
      //   p -> q, r -> s
      const edges: Edge[] = [
        {
          id: "외부-1",
          source: "p",
          target: "q",
          sourceHandle: "s9",
          targetHandle: "t9",
        },
        {
          id: "keep-3",
          source: "node",
          target: "a",
          sourceHandle: "source-3",
          targetHandle: "t0",
        },
        {
          id: "keep-0",
          source: "node",
          target: "b",
          sourceHandle: "source-0",
          targetHandle: "t1",
        },
        {
          id: "keep-1",
          source: "node",
          target: "c",
          sourceHandle: "source-1",
          targetHandle: "t2",
        },
        {
          id: "외부-2",
          source: "r",
          target: "s",
          sourceHandle: "s10",
          targetHandle: "t10",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "source",
        nextCount: 2,
      });

      expect(result.shouldUpdate).toBe(true);
      expect(result.nextEdges.map((edge) => edge.id)).toEqual([
        "외부-1",
        "외부-2",
        "keep-0",
        "keep-1",
      ]);
      const handles = result.nextEdges
        .filter((edge) => edge.source === "node")
        .map((edge) => edge.sourceHandle);
      expect(handles).toEqual(["source0", "source1"]);
    });

    it("핸들 값이 없으면 해당 엣지를 버리고 나머지를 압축한다", () => {
      // 입력값:
      //   node(?) -> a   (핸들 누락)
      //   node(source-2) -> b
      //   x -> y (외부)
      // 기댓값:
      //   node(source0) -> b
      //   x -> y
      const edges: Edge[] = [
        {
          id: "missing",
          source: "node",
          target: "a",
          sourceHandle: undefined,
          targetHandle: "t0",
        },
        {
          id: "keep",
          source: "node",
          target: "b",
          sourceHandle: "source-2",
          targetHandle: "t1",
        },
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "s1",
          targetHandle: "t2",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "source",
        nextCount: 3,
      });

      expect(result.shouldUpdate).toBe(true);
      expect(result.nextEdges.map((edge) => edge.id)).toEqual(["외부", "keep"]);
      const related = result.nextEdges.filter((edge) => edge.source === "node");
      expect(related.map((edge) => edge.sourceHandle)).toEqual(["source0"]);
    });

    it("숫자 접미사가 없으면 0으로 간주해 가장 먼저 남긴다", () => {
      // 입력값:
      //   node(source-2) -> a
      //   node(source   ) -> b
      //   x -> y (외부)
      // 기댓값:
      //   node(source0) -> b
      //   x -> y
      const edges: Edge[] = [
        {
          id: "with-suffix",
          source: "node",
          target: "a",
          sourceHandle: "source-2",
          targetHandle: "t0",
        },
        {
          id: "no-suffix",
          source: "node",
          target: "b",
          sourceHandle: "source",
          targetHandle: "t1",
        },
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "s1",
          targetHandle: "t2",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "source",
        nextCount: 1,
      });

      expect(result.shouldUpdate).toBe(true);
      expect(result.nextEdges.map((edge) => edge.id)).toEqual([
        "외부",
        "no-suffix",
      ]);
      const handle = result.nextEdges.find(
        (edge) => edge.id === "no-suffix",
      )?.sourceHandle;
      expect(handle).toBe("source0");
    });
  });

  describe("target/source 믹스 압축", () => {
    it("target 압축 후 source 압축을 적용해 양쪽 핸들이 모두 재배열된다", () => {
      // 입력값:
      //   a --s1--> node(target-3)
      //   b --s2--> node(target-1)
      //   node(source-4) --t0--> c
      //   node(source-1) --t1--> d
      //   x --sx--> y(ty)
      // 기댓값:
      //   b --s2--> node(target0)
      //   node(source0) --t1--> d
      //   x --sx--> y(ty)
      const edges: Edge[] = [
        {
          id: "t-gap",
          source: "a",
          target: "node",
          sourceHandle: "s1",
          targetHandle: "target-3",
        },
        {
          id: "t-keep",
          source: "b",
          target: "node",
          sourceHandle: "s2",
          targetHandle: "target-1",
        },
        {
          id: "s-gap",
          source: "node",
          target: "c",
          sourceHandle: "source-4",
          targetHandle: "t0",
        },
        {
          id: "s-keep",
          source: "node",
          target: "d",
          sourceHandle: "source-1",
          targetHandle: "t1",
        },
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "sx",
          targetHandle: "ty",
        },
      ];

      const afterTarget = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "target",
        nextCount: 1,
      });

      const afterSource = pruneEdgesForHandleCount(afterTarget.nextEdges, {
        nodeId: "node",
        kind: "source",
        nextCount: 1,
      });

      expect(afterTarget.shouldUpdate).toBe(true);
      expect(afterSource.shouldUpdate).toBe(true);
      expect(afterSource.nextEdges.map((edge) => edge.id)).toEqual([
        "외부",
        "t-keep",
        "s-keep",
      ]);
      const targetHandles = afterSource.nextEdges
        .filter((edge) => edge.target === "node")
        .map((edge) => edge.targetHandle);
      expect(targetHandles).toEqual(["target0"]);
      const sourceHandles = afterSource.nextEdges
        .filter((edge) => edge.source === "node")
        .map((edge) => edge.sourceHandle);
      expect(sourceHandles).toEqual(["source0"]);
    });

    it("source 압축 후 target 압축을 적용해 각 단계가 독립적으로 작동한다", () => {
      // 입력값:
      //   node(source-5) -> a
      //   node(source-1) -> b
      //   c --sc--> node(target-3)
      //   d --sd--> node(target-0)
      //   x --sx--> y(ty)
      // 기댓값:
      //   node(source0) -> b
      //   d --sd--> node(target0)
      //   x --sx--> y(ty)
      const edges: Edge[] = [
        {
          id: "s-gap",
          source: "node",
          target: "a",
          sourceHandle: "source-5",
          targetHandle: "ta",
        },
        {
          id: "s-keep",
          source: "node",
          target: "b",
          sourceHandle: "source-1",
          targetHandle: "tb",
        },
        {
          id: "t-gap",
          source: "c",
          target: "node",
          sourceHandle: "sc",
          targetHandle: "target-3",
        },
        {
          id: "t-keep",
          source: "d",
          target: "node",
          sourceHandle: "sd",
          targetHandle: "target-0",
        },
        {
          id: "외부",
          source: "x",
          target: "y",
          sourceHandle: "sx",
          targetHandle: "ty",
        },
      ];

      const afterSource = pruneEdgesForHandleCount(edges, {
        nodeId: "node",
        kind: "source",
        nextCount: 1,
      });

      const afterTarget = pruneEdgesForHandleCount(afterSource.nextEdges, {
        nodeId: "node",
        kind: "target",
        nextCount: 1,
      });

      expect(afterSource.shouldUpdate).toBe(true);
      expect(afterTarget.shouldUpdate).toBe(true);
      expect(afterTarget.nextEdges.map((edge) => edge.id)).toEqual([
        "외부",
        "s-keep",
        "t-keep",
      ]);
      const sourceHandles = afterTarget.nextEdges
        .filter((edge) => edge.source === "node")
        .map((edge) => edge.sourceHandle);
      expect(sourceHandles).toEqual(["source0"]);
      const targetHandles = afterTarget.nextEdges
        .filter((edge) => edge.target === "node")
        .map((edge) => edge.targetHandle);
      expect(targetHandles).toEqual(["target0"]);
    });
  });
});

describe("handleCountRefine", () => {
  it("빈 문자열 또는 공백만 있을 때 true를 반환한다", () => {
    expect(handleCountRefine("")).toBe(true);
    expect(handleCountRefine("   ")).toBe(true);
  });

  it("0~5 사이 정수를 허용한다", () => {
    expect(handleCountRefine("0")).toBe(true);
    expect(handleCountRefine("3")).toBe(true);
    expect(handleCountRefine("5")).toBe(true);
  });

  it("정수로 변환되는 숫자 문자열은 허용하고 소수는 거부한다", () => {
    expect(handleCountRefine("5.0")).toBe(true);
    expect(handleCountRefine("4.5")).toBe(false);
  });

  it("범위를 벗어나거나 숫자가 아닌 값은 거부한다", () => {
    expect(handleCountRefine("-1")).toBe(false);
    expect(handleCountRefine("6")).toBe(false);
    expect(handleCountRefine("abc")).toBe(false);
  });
});
