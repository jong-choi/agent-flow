import { describe, expect, it } from "vitest";
import { type Connection, type Edge } from "@xyflow/react";
import { checkValidConnection } from "@/features/canvas/hooks/use-is-valid-connection";

describe("checkValidConnection 함수에 대한 유닛 테스트", () => {
  it("노드 간에 중복된 연결이 발생하는 경우 기존 false를 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
    ];

    const newConnection: Connection = {
      source: "1",
      target: "2",
      sourceHandle: "b",
      targetHandle: "c",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });

  it("같은 노드의 핸들끼리 연결이 발생하는 경우 기존 false를 반환한다.", () => {
    const existingEdges: Edge[] = [];

    const newConnection: Connection = {
      source: "1",
      target: "1",
      sourceHandle: "a",
      targetHandle: "b",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });

  it("이미 연결된 source 핸들에 연결이 발생하는 경우 기존 false를 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
    ];

    const newConnection: Connection = {
      source: "1",
      target: "3",
      sourceHandle: "a",
      targetHandle: "c",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });

  it("이미 연결된 target 핸들에 연결이 발생하는 경우 기존 false를 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
    ];

    const newConnection: Connection = {
      source: "3",
      target: "2",
      sourceHandle: "c",
      targetHandle: "b",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });

  it("어떤 노드의 source 핸들이 연결되지 않은 노드의 연결이 없는 target 핸들과 연결되는 경우 true 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
    ];

    const newConnection: Connection = {
      source: "3",
      target: "4",
      sourceHandle: "c",
      targetHandle: "d",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(true);
  });

  it("이미 연결된 노드 간에 역방향 연결이 발생하는 경우 false를 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
    ];

    const newConnection: Connection = {
      source: "2",
      target: "1",
      sourceHandle: "c",
      targetHandle: "d",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });

  it("사이클을 형성하는 연결이 발생하는 경우 false를 반환한다.", () => {
    const existingEdges: Edge[] = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        sourceHandle: "a",
        targetHandle: "b",
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        sourceHandle: "c",
        targetHandle: "d",
      },
    ];

    // 3 -> 1 연결 시도 (사이클: 1 -> 2 -> 3 -> 1)
    const newConnection: Connection = {
      source: "3",
      target: "1",
      sourceHandle: "e",
      targetHandle: "f",
    };

    const result = checkValidConnection(newConnection, existingEdges);
    expect(result).toEqual(false);
  });
});
