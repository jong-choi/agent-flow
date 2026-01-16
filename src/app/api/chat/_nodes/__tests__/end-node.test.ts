import { describe, expect, it } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { endNode } from "@/app/api/chat/_nodes/end-node";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

describe("endNode", () => {
  it("입력이 0개면 에러가 발생한다", async () => {
    const nodeId = "end-node";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = {};

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    await expect(endNode(state, config)).rejects.toThrow(
      "end-node는 단일 입력만 허용합니다.",
    );
  });

  it("입력이 2개면 에러가 발생한다", async () => {
    const nodeId = "end-node";
    const inputNodeId1 = "input-node-1";
    const inputNodeId2 = "input-node-2";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = {
      input1: inputNodeId1,
      input2: inputNodeId2,
    };

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    await expect(endNode(state, config)).rejects.toThrow(
      "end-node는 단일 입력만 허용합니다.",
    );
  });

  it("입력이 1개면 통과한다", async () => {
    const nodeId = "end-node";
    const inputNodeId = "input-node";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = { input: inputNodeId };

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    await expect(endNode(state, config)).resolves.toEqual({});
  });
});
