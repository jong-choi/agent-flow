import { type Edge } from "@xyflow/react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import { FlowNode } from "@/features/canvas/components/flow/flow-node/flow-node";
import {
  type NodeType,
  nodeTypes,
} from "@/features/canvas/constants/node-types";

export const INITIAL_NODES: FlowCanvasNode[] = [];
export const INITIAL_EDGES: Edge[] = [];
export const NODE_TYPE: Record<NodeType, typeof FlowNode> = Object.fromEntries(
  nodeTypes.map((type) => [type, FlowNode]),
) as Record<NodeType, typeof FlowNode>;
