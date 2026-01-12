import { describe, expect, it } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { mergeNode } from "@/app/api/chat/_nodes/merge-node";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";

describe("mergeNode", () => {
  it("merge 노드는 input-1, input-2, input-3을 찾아서 input1-input2-input3 형태로 저장한다", async () => {
    const crrNodeId = "merge-node";
    const inputNode1Id = "input-1-node";
    const inputNode2Id = "input-2-node";
    const inputNode3Id = "input-3-node";
    const input1 = "인풋1이다";
    const input2 = "인풋2다";
    const input3 = "인풋3이다";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[crrNodeId] = {
      "input-3": inputNode3Id,
      "input-2": inputNode2Id,
      "input-1": inputNode1Id,
    };
    state.outputMap[inputNode1Id] = input1;
    state.outputMap[inputNode2Id] = input2;
    state.outputMap[inputNode3Id] = input3;

    const config = {
      metadata: { langgraph_node: crrNodeId },
    } as unknown as FlowRunnableConfig;

    const result = await mergeNode(state, config);

    expect(result.outputMap?.[crrNodeId]).toBe(
      `${input1}\n\n${input2}\n\n${input3}`,
    );
  });

  it("merge 노드는 input-1, input-3가 있고 input-2가 없을 때에는 input1-input3 형태로 저장한다", async () => {
    const crrNodeId = "merge-node";
    const inputNode1Id = "input-1-node";
    const inputNode3Id = "input-3-node";
    const input1 = "인풋1이다";
    const input3 = "인풋3이다";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[crrNodeId] = {
      "input-1": inputNode1Id,
      "input-3": inputNode3Id,
    };
    state.outputMap[inputNode1Id] = input1;
    state.outputMap[inputNode3Id] = input3;

    const config = {
      metadata: { langgraph_node: crrNodeId },
    } as unknown as FlowRunnableConfig;

    const result = await mergeNode(state, config);

    expect(result.outputMap?.[crrNodeId]).toBe(`${input1}\n\n${input3}`);
  });

  it("merge 노드는 노드 중 하나가 null이면 에러가 발생한다", async () => {
    const crrNodeId = "merge-node";
    const inputNode1Id = "input-1-node";
    const inputNode2Id = "input-2-node";
    const input1 = "인풋1이다";
    const input2 = null;

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[crrNodeId] = {
      "input-1": inputNode1Id,
      "input-2": inputNode2Id,
    };
    state.outputMap[inputNode1Id] = input1;
    state.outputMap[inputNode2Id] = input2;

    const config = {
      metadata: { langgraph_node: crrNodeId },
    } as unknown as FlowRunnableConfig;

    await expect(mergeNode(state, config)).rejects.toThrow();
  });
});
