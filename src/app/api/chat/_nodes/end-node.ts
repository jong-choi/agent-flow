import { createApiError } from "@/app/api/_errors/api-error";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

export const endNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw createApiError("invalidRequest", {
      message: "Invalid end node id.",
    });
  }

  const inputChildren = state.inputTree[nodeId] ?? {};
  const inputEntries = Object.entries(inputChildren);
  if (inputEntries.length !== 1) {
    throw createApiError("invalidRequest", {
      message: "End node only accepts a single input.",
    });
  }

  return {};
};
