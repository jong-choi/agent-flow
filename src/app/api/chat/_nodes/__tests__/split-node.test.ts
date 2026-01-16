// target핸들에 연결된 하나의 응답을 source핸들에 연결된 여러 노드들에게 보내주는 노드
import { describe, expect, it } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { splitNode } from "@/app/api/chat/_nodes/split-node";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

describe("splitNode", () => {
  it("입력이 있으면 입력값을 그대로 저장한다", async () => {
    const nodeId = "split-node";
    const inputNodeId = "input-node";
    const input = "분할 입력";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = { target: inputNodeId };
    state.outputMap[inputNodeId] = input;

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    const result = await splitNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe(input);
  });

  it("입력이 2개 이상이면 에러가 발생한다", async () => {
    const nodeId = "split-node";
    const inputNodeId1 = "input-node-1";
    const inputNodeId2 = "input-node-2";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = {
      target1: inputNodeId1,
      target2: inputNodeId2,
    };
    state.outputMap[inputNodeId1] = "입력 1";
    state.outputMap[inputNodeId2] = "입력 2";

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    await expect(splitNode(state, config)).rejects.toThrow(
      "단일 입력 노드에 여러 입력이 있습니다.",
    );
  });
});
