import { createApiError } from "@/app/api/_errors/api-error";
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
    throw createApiError("invalidRequest", {
      message: "Invalid node id.",
    });
  }

  const inputChildren = state.inputTree[nodeId];
  if (!inputChildren) {
    throw createApiError("graphNotFound", {
      message: "Missing input tree for node.",
    });
  }
  const inputEntries = Object.entries(inputChildren);
  if (inputEntries.length > 1) {
    throw createApiError("invalidRequest", {
      message: "Single input node has multiple inputs.",
    });
  }

  const inputNodeId = inputEntries[0]?.[1];
  const inputValue = inputNodeId ? state.outputMap[inputNodeId] : null;
  const input = typeof inputValue === "string" ? inputValue : null;
  return input;
};
