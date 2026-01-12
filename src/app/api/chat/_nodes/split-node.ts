import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";

export const splitNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const input = findSingleNodeInput({ state, config });

  const output = input ?? metadata?.data?.label ?? "splitNode";
  const outputMap = state.outputMap;
  outputMap[nodeId] = output;

  return { outputMap };
};
