import { describe, expect, it } from "vitest";
import { type Edge, type Node } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import {
  checkValidGraph,
  checkValidNode,
} from "@/features/canvas/hooks/use-check-valid-graph";

describe("checkValidGraph 함수에 대한 유닛 테스트", () => {
  it("시작 노드가 없는 경우 false를 반환한다.", () => {
    // Graph:
    // [1:채팅] ---> [2:종료]
    //
    const nodes: Node[] = [
      {
        id: "1",
        type: "flowNode",
        position: { x: 0, y: 0 },
        data: { label: "채팅" },
      },
      {
        id: "2",
        type: "endNode",
        position: { x: 0, y: 100 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("종료 노드가 없는 경우 false를 반환한다.", () => {
    // Graph:
    // [1:시작] ---> [2:채팅]
    //
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "채팅" },
      },
    ];
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("시작 노드에서 종료 노드까지 경로가 존재하는 경우 true를 반환한다.", () => {
    // Graph:
    // [1:시작] ---> [2:채팅] ---> [3:종료]
    //
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "채팅" },
      },
      {
        id: "3",
        type: "endNode",
        position: { x: 0, y: 200 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "2" },
      { id: "e2", source: "2", target: "3" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(true);
  });

  it("시작 노드에서 종료 노드까지 경로가 없는 경우 false를 반환한다.", () => {
    // Graph:
    // [1:시작] ---> [2:채팅]   [3:검색] ---> [4:종료]
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "채팅" },
      },
      {
        id: "3",
        type: "flowNode",
        position: { x: 0, y: 200 },
        data: { label: "검색" },
      },
      {
        id: "4",
        type: "endNode",
        position: { x: 0, y: 300 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "2" },
      { id: "e2", source: "3", target: "4" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("고립된 노드가 있는 경우 false를 반환한다.", () => {
    // Graph:
    // [1:시작] ---> [2:채팅] ---> [4:종료]
    // [3:검색]
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "채팅" },
      },
      {
        id: "3",
        type: "flowNode",
        position: { x: 0, y: 200 },
        data: { label: "검색" },
      }, // 고립된 노드
      {
        id: "4",
        type: "endNode",
        position: { x: 0, y: 300 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "2" },
      { id: "e2", source: "2", target: "4" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("분기된 경로 중 일부만 종료 노드로 이어지는 경우 false를 반환한다.", () => {
    // Graph:
    //                    ┌---> [3:채팅] ---> [5:종료]
    // [1:시작] ---> [2:분할]
    //                    └---> [4:검색]
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "분할" },
      },
      {
        id: "3",
        type: "flowNode",
        position: { x: 0, y: 200 },
        data: { label: "채팅" },
      },
      {
        id: "4",
        type: "flowNode",
        position: { x: 0, y: 300 },
        data: { label: "검색" },
      },
      {
        id: "5",
        type: "endNode",
        position: { x: 0, y: 400 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "2" },
      { id: "e2", source: "2", target: "3" },
      { id: "e3", source: "2", target: "4" },
      { id: "e4", source: "3", target: "5" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("시작 노드가 여러 개인 경우 false를 반환한다.", () => {
    // Graph:
    // [1:시작] ----
    //              └---> [3:채팅] ---> [4:종료]
    // [2:시작] ----
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "startNode",
        position: { x: 0, y: 100 },
        data: { label: "시작" },
      },
      {
        id: "3",
        type: "flowNode",
        position: { x: 0, y: 200 },
        data: { label: "채팅" },
      },
      {
        id: "4",
        type: "endNode",
        position: { x: 0, y: 300 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "3" },
      { id: "e2", source: "2", target: "3" },
      { id: "e3", source: "3", target: "4" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("종료 노드가 여러 개인 경우 false를 반환한다.", () => {
    // Graph:
    //                    ┌---> [3:종료]
    // [1:시작] ---> [2:분할]
    //                    └---> [4:종료]
    //
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 0, y: 0 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 0, y: 100 },
        data: { label: "분할" },
      },
      {
        id: "3",
        type: "endNode",
        position: { x: 0, y: 200 },
        data: { label: "종료" },
      },
      {
        id: "4",
        type: "endNode",
        position: { x: 0, y: 300 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "2" },
      { id: "e2", source: "2", target: "3" },
      { id: "e3", source: "2", target: "4" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });

  it("시작 노드와 연결되지 않은 노드가 존재하는 경우 false를 반환한다.", () => {
    // Graph:
    // [1:시작] -----
    //               └---> [3:병합] ---> [4:종료]
    // [2:채팅] -----
    //
    const nodes: Node[] = [
      {
        id: "1",
        type: "startNode",
        position: { x: 100, y: 280 },
        data: { label: "시작" },
      },
      {
        id: "2",
        type: "flowNode",
        position: { x: 280, y: 130 },
        data: { label: "채팅" },
      },
      {
        id: "3",
        type: "flowNode",
        position: { x: 480, y: 250 },
        data: { label: "병합" },
      },
      {
        id: "4",
        type: "endNode",
        position: { x: 770, y: 280 },
        data: { label: "종료" },
      },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "1", target: "3" },
      { id: "e2", source: "2", target: "3" },
      { id: "e3", source: "3", target: "4" },
    ];
    const result = checkValidGraph(nodes, edges);
    expect(result).toEqual(false);
  });
});

describe("checkValidNode 함수에 대한 유닛 테스트", () => {
  it("node.type이 없는 경우 isValid는 false이다.", () => {
    const node = {
      id: "1",
      position: { x: 0, y: 0 },
      data: { label: "시작" },
    } as FlowCanvasNode;

    const { isValid } = checkValidNode(node);
    expect(isValid).toEqual(false);
  });

  it("node.type이 chatNode이고 data.content.value가 없는 경우 isValid는 false이다.", () => {
    const node = {
      id: "1",
      type: "chatNode",
      position: { x: 0, y: 0 },
      data: { label: "채팅", content: { id: "hi" } },
    } as FlowCanvasNode;

    const { isValid } = checkValidNode(node);
    expect(isValid).toEqual(false);
  });

  it("node.type이 chatNode이고 data.content.value가 isValid는 true이다.", () => {
    const node = {
      id: "1",
      type: "chatNode",
      position: { x: 0, y: 0 },
      data: { label: "채팅", content: { id: "hi", value: "gemma-3-1b-it" } },
    } as FlowCanvasNode;

    const { isValid } = checkValidNode(node);
    expect(isValid).toEqual(true);
  });
});
