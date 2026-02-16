import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

/**
 * 노드의 시작점
 * 사용자 입력 프롬프트를 outputMap에 지정하여 넣는다.
 */
export const startNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const initialInput = state.initialInput;
  if (typeof initialInput !== "string") {
    throw new Error("initialInput이 문자열이 아닙니다.");
  }

  return { outputMap: { [nodeId]: initialInput }, startNodeId: nodeId };
};
