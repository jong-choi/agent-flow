import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

export const endNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const inputChildren = state.inputTree[nodeId] ?? {};
  const inputEntries = Object.entries(inputChildren);
  if (inputEntries.length !== 1) {
    throw new Error("end-node는 단일 입력만 허용합니다.");
  }

  return {};
};
