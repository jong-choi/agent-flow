import { describe, expect, it } from "vitest";
import { type Edge } from "@xyflow/react";
import {
  handleCountRefine,
  pruneEdgesForHandleCount,
} from "@/features/canvas/utils/canvas-node-panel";

describe("pruneEdgesForHandleCount 함수에 대한 유닛 테스트", () => {
  describe("관련 여부 판단", () => {
    it("관련 없는 엣지는 그대로 유지된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e3-4",
          source: "3",
          target: "4",
          sourceHandle: "source-1",
          targetHandle: "target-1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "5",
        kind: "target",
        nextCount: 1,
      });

      expect(result).toEqual(edges);
    });

    it("kind가 target이면 target만 비교해서 관련 여부를 판단한다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "2",
          target: "3",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 1,
      });

      expect(result).toEqual(edges);
    });

    it("kind가 source이면 source만 비교해서 관련 여부를 판단한다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "3",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "source",
        nextCount: 1,
      });

      expect(result).toEqual(edges);
    });

    it("관련 엣지의 핸들이 누락되면 제거된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: null,
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 1,
      });

      expect(result).toEqual([]);
    });
  });

  describe("숫자 접미사 파싱", () => {
    it("숫자 접미사가 없으면 0으로 취급한다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 1,
      });

      // 접미사가 없으면 0으로 간주해서 nextCount=1에 포함된다.
      expect(result.map((edge) => edge.id)).toEqual(["e1-2"]);
    });

    it("복수 자리 숫자도 접미사로 파싱된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-12",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 13,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e1-2"]);
    });

    it("0 패딩 숫자도 정상 파싱된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-01",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 2,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e1-2"]);
    });
  });

  describe("target 핸들 감소 규칙", () => {
    it("nextCount가 0이면 관련 엣지가 전부 제거된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 0,
      });

      // nextCount-1이 -1이라 어떤 접미사도 통과하지 않는다.
      expect(result).toEqual([]);
    });

    it("nextCount가 1이면 접미사 0만 유지된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e3-2",
          source: "3",
          target: "2",
          sourceHandle: "source-1",
          targetHandle: "target-1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 1,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e1-2"]);
    });

    it("nextCount가 2이면 접미사 0과 1만 유지된다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e3-2",
          source: "3",
          target: "2",
          sourceHandle: "source-1",
          targetHandle: "target-1",
        },
        {
          id: "e4-2",
          source: "4",
          target: "2",
          sourceHandle: "source-2",
          targetHandle: "target-2",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 2,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e1-2", "e3-2"]);
    });

    it("숫자 접미사가 범위를 벗어나면 제거된다.", () => {
      const edges: Edge[] = [
        {
          id: "e9-2",
          source: "9",
          target: "2",
          sourceHandle: "source-9",
          targetHandle: "target-9",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 3,
      });

      expect(result).toEqual([]);
    });
  });

  describe("source 핸들 감소 규칙", () => {
    it("source 기준으로 숫자 접미사를 비교한다.", () => {
      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e1-3",
          source: "1",
          target: "3",
          sourceHandle: "source-2",
          targetHandle: "target-1",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 2,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e1-2"]);
    });

    it("관련 없는 엣지는 source 감소 시에도 유지된다.", () => {
      const edges: Edge[] = [
        {
          id: "e9-1",
          source: "9",
          target: "1",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
      ];

      const result = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 1,
      });

      expect(result.map((edge) => edge.id)).toEqual(["e9-1"]);
    });
  });

  describe("target/source 복합 시나리오", () => {
    it("target 필터링 후 source 필터링을 연속 적용한다.", () => {
      let edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e1-2b",
          source: "1",
          target: "2",
          sourceHandle: "source-1",
          targetHandle: "target-1",
        },
        {
          id: "e3-2",
          source: "3",
          target: "2",
          sourceHandle: "source-2",
          targetHandle: "target-2",
        },
        {
          id: "e1-4",
          source: "1",
          target: "4",
          sourceHandle: "source-2",
          targetHandle: "target-0",
        },
      ];

      edges = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 2,
      });

      edges = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 1,
      });

      expect(edges.map((edge) => edge.id)).toEqual(["e1-2"]);
    });

    it("source 필터링 후 target 필터링을 연속 적용한다.", () => {
      let edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-0",
        },
        {
          id: "e1-3",
          source: "1",
          target: "3",
          sourceHandle: "source-1",
          targetHandle: "target-1",
        },
        {
          id: "e4-2",
          source: "4",
          target: "2",
          sourceHandle: "source-0",
          targetHandle: "target-2",
        },
      ];

      edges = pruneEdgesForHandleCount(edges, {
        nodeId: "1",
        kind: "source",
        nextCount: 1,
      });

      edges = pruneEdgesForHandleCount(edges, {
        nodeId: "2",
        kind: "target",
        nextCount: 1,
      });

      expect(edges.map((edge) => edge.id)).toEqual(["e1-2"]);
    });
  });
});

describe("handleCountRefine 함수에 대한 유닛 테스트", () => {
  it("빈 문자열 또는 공백만 있는 경우 true를 반환한다.", () => {
    expect(handleCountRefine("")).toEqual(true);
    expect(handleCountRefine("   ")).toEqual(true);
  });

  it("0에서 5 사이의 정수는 true를 반환한다.", () => {
    expect(handleCountRefine("0")).toEqual(true);
    expect(handleCountRefine(" 3 ")).toEqual(true);
    expect(handleCountRefine("5")).toEqual(true);
  });

  it("0 패딩이 있어도 정수로 인식한다.", () => {
    expect(handleCountRefine("003")).toEqual(true);
  });

  it("정수 형태이지만 소수 표현은 허용하지 않는다.", () => {
    expect(handleCountRefine("5.0")).toEqual(true);
    expect(handleCountRefine("5.1")).toEqual(false);
  });

  it("범위를 벗어나거나 숫자가 아닌 값은 false를 반환한다.", () => {
    expect(handleCountRefine("-1")).toEqual(false);
    expect(handleCountRefine("6")).toEqual(false);
    expect(handleCountRefine("2.5")).toEqual(false);
    expect(handleCountRefine("abc")).toEqual(false);
    expect(handleCountRefine("NaN")).toEqual(false);
  });
});
