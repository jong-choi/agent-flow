import { type z } from "zod";
import { type Node } from "@xyflow/react";
import { sidebarNodesQuerySchema } from "@/db/schema";
import { type nodeTypes } from "@/features/canvas/constants/node-types";

export type SidebarNodeData = z.infer<typeof sidebarNodesQuerySchema>;

export const flowNodeDataSchema = sidebarNodesQuerySchema.omit({
  id: true,
  type: true,
  createdAt: true,
});

export type FlowNodeData = z.infer<typeof flowNodeDataSchema>;
export type FlowCanvasNode = Node<FlowNodeData, (typeof nodeTypes)[number]>;
