import { createApiError } from "@/app/api/_errors/api-error";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";

export const promptNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw createApiError("invalidRequest", {
      message: "Invalid prompt node id.",
    });
  }

  const input = findSingleNodeInput({ state, config });

  const template = metadata?.data?.content?.value;
  const output =
    typeof template === "string"
      ? template.replace(/\{input\}/g, input ?? "")
      : (input ?? metadata?.data?.label ?? "promptNode");

  return { outputMap: { [nodeId]: output } };
};
