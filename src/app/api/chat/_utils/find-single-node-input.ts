import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

export const findSingleNodeInput = ({
  state,
  config,
}: {
  state: typeof FlowStateAnnotation.State;
  config: FlowRunnableConfig;
}) => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const inputChildren = state.inputTree[nodeId];
  const inputEntries = Object.entries(inputChildren);
  if (inputEntries.length > 1) {
    throw new Error("단일 입력 노드에 여러 입력이 있습니다.");
  }

  const inputNodeId = inputEntries[0]?.[1];
  const inputValue = inputNodeId ? state.outputMap[inputNodeId] : null;
  const input = typeof inputValue === "string" ? inputValue : null;
  return input;
};
