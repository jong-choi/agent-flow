import { describe, expect, it } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { promptNode } from "@/app/api/chat/_nodes/prompt-node";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

describe("promptNode", () => {
  it("template의 {input}을 입력값으로 치환한다", async () => {
    const nodeId = "prompt-node";
    const inputNodeId = "input-node";
    const input = "고양이";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = { target: inputNodeId };
    state.outputMap[inputNodeId] = input;

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "{input}을 검색해줘" },
        },
      },
    } as unknown as FlowRunnableConfig;

    const result = await promptNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe("고양이을 검색해줘");
  });
});
