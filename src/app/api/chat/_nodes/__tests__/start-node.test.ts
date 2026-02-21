import { describe, expect, it } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { startNode } from "@/app/api/chat/_nodes/start-node";

describe("startNode", () => {
  it("initialInput을 outputMap에 저장한다", async () => {
    const nodeId = "start-node";
    const initialInput = "안녕";

    const state = {
      inputTree: {},
      outputMap: {},
      initialInput,
    } as typeof FlowStateAnnotation.State;

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    const result = await startNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe(initialInput);
    expect(result.startNodeId).toBe(nodeId);
  });

  it("initialInput이 문자열이 아니면 에러가 발생한다", async () => {
    const nodeId = "start-node";

    const state = {
      inputTree: {},
      outputMap: {},
      initialInput: null,
    } as typeof FlowStateAnnotation.State;

    const config = {
      metadata: { langgraph_node: nodeId },
    } as unknown as FlowRunnableConfig;

    await expect(startNode(state, config)).rejects.toMatchObject({
      code: "invalid_request",
      type: "invalid_request_error",
    });
  });
});
