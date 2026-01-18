import { type LangGraphRunnableConfig } from "@langchain/langgraph";
import { type FlowNodeData } from "@/db/types/sidebar-nodes";

export interface FlowRunnableConfig extends LangGraphRunnableConfig {
  metadata?: { data: FlowNodeData } & LangGraphRunnableConfig["metadata"];
}
