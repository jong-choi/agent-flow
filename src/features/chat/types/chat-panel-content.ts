export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  langgraph_node?: string;
}

export type StreamingBlock = {
  langgraph_node: string;
  content: string;
  status: "streaming" | "done";
  timestamp?: string;
};

export type StreamingBlocksState = {
  order: string[];
  blocks: Record<string, StreamingBlock>;
};
