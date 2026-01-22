import { z } from "zod";
import { flowNodeDataSchema } from "@/db/types/sidebar-nodes";
import {
  type NodeType,
  nodeTypes,
} from "@/features/canvas/constants/node-types";

export const flowNodeSchema = z
  .object({
    id: z.string(),
    type: z.enum(nodeTypes),
    position: z.object({ x: z.number(), y: z.number() }),
    data: flowNodeDataSchema,
  })
  .loose();

export const flowEdgeSchema = z
  .object({
    id: z.string().optional(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().nullish(),
    targetHandle: z.string().nullish(),
  })
  .loose();

// 주의 : xyflow의 nodes/edges 타입 중 중 일부만 가지고 있음
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;

export const isValidNodeType = (type: string): type is NodeType => {
  const nodeTypeSet = new Set<string>(nodeTypes);
  return nodeTypeSet.has(type);
};
