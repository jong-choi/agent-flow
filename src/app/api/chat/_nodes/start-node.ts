import { createApiError } from "@/app/api/_errors/api-error";
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
    throw createApiError("invalidRequest", {
      message: "Invalid start node id.",
    });
  }

  const initialInput = state.initialInput;
  if (typeof initialInput !== "string") {
    throw createApiError("invalidRequest", {
      message: "Invalid initial input.",
    });
  }

  return { outputMap: { [nodeId]: initialInput }, startNodeId: nodeId };
};
