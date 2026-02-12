import { describe, expect, it } from "vitest";
import { type WorkflowNode } from "@/db/schema/workflows";
import {
  DEFAULT_ZOOM,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/features/canvas/constants/canvas-preview";
import {
  buildMermaidCode,
  clampZoom,
  escapeMermaidLabel,
  getAutoFitZoom,
  getNextZoom,
} from "@/features/canvas/utils/canvas-preview";

describe("canvas-preview 유틸", () => {
  it("휠 델타가 음수면 줌이 증가한다", () => {
    expect(getNextZoom(1, -120)).toBe(1.1);
  });

  it("휠 델타가 양수면 줌이 감소한다", () => {
    expect(getNextZoom(1, 120)).toBe(0.9);
  });

  it("줌 값을 최소/최대 경계로 제한한다", () => {
    expect(clampZoom(0)).toBe(ZOOM_MIN);
    expect(clampZoom(100)).toBe(ZOOM_MAX);
  });

  it("설정된 기본 줌 값을 사용한다", () => {
    expect(DEFAULT_ZOOM).toBe(1);
  });

  it("Mermaid 라벨에서 백슬래시, 따옴표, 줄바꿈을 이스케이프한다", () => {
    expect(escapeMermaidLabel('a\\b "quote"\nnext')).toBe(
      'a\\\\b \\"quote\\"<br/>next',
    );
  });

  it("노드 타입(작은 글씨)과 기본 라벨로 Mermaid 그래프 문자열을 생성한다", () => {
    const nodes = [
      {
        id: "wf-node-1",
        nodeId: "start-1",
        workflowId: "wf-1",
        ownerId: "user-1",
        type: "startNode",
        posX: 0,
        posY: 0,
        label: "Start",
        description: null,
        value: null,
        contentReferenceId: null,
        targetCount: null,
        sourceCount: null,
      },
      {
        id: "wf-node-2",
        nodeId: "unknown-1",
        workflowId: "wf-1",
        ownerId: "user-1",
        type: "mergeNode",
        posX: 100,
        posY: 0,
        label: "Fallback Target",
        description: null,
        value: null,
        contentReferenceId: null,
        targetCount: null,
        sourceCount: null,
      },
    ];

    const edges = [
      {
        id: "wf-edge-1",
        edgeId: "edge-1",
        workflowId: "wf-1",
        ownerId: "user-1",
        source: "start-1",
        target: "unknown-1",
        sourceHandle: "s-1",
        targetHandle: "t-1",
      },
    ];

    const chart = buildMermaidCode(nodes as WorkflowNode[], edges);

    expect(chart).toContain("graph LR");
    expect(chart).toContain("START");
    expect(chart).toContain("MERGE");
    expect(chart).toContain("n1 --> n2");
    expect(chart).not.toContain("classDef");
    expect(chart).not.toContain("\n  class ");
  });

  it("자동 맞춤 줌은 작은 그래프를 뷰포트에 맞게 확대한다", () => {
    const next = getAutoFitZoom({
      currentZoom: DEFAULT_ZOOM,
      viewportWidth: 900,
      viewportHeight: 300,
      graphWidth: 120,
      graphHeight: 80,
    });

    expect(next).toBeGreaterThan(DEFAULT_ZOOM);
    expect(next).toBeLessThanOrEqual(ZOOM_MAX);
  });

  it("자동 맞춤 줌은 현재 줌보다 작아지지 않는다", () => {
    const next = getAutoFitZoom({
      currentZoom: DEFAULT_ZOOM,
      viewportWidth: 220,
      viewportHeight: 120,
      graphWidth: 500,
      graphHeight: 200,
    });

    expect(next).toBe(DEFAULT_ZOOM);
  });
});
