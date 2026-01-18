import { z } from "zod";
import { flowNodeDataSchema } from "@/db/types/sidebar-nodes";

export const nodeTypes = [
  "startNode",
  "splitNode",
  "promptNode",
  "chatNode",
  "searchNode",
  "mergeNode",
  "endNode",
] as const;

const flowNodeDataApiSchema = flowNodeDataSchema.extend({
  createdAt: z.iso.datetime(),
});

export const flowNodeSchema = z
  .object({
    id: z.string(),
    type: z.enum(nodeTypes),
    position: z.object({ x: z.number(), y: z.number() }),
    data: flowNodeDataApiSchema,
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

type NodeType = (typeof nodeTypes)[number];

export const isValidNodeType = (type: string): type is NodeType => {
  const nodeTypeSet = new Set<string>(nodeTypes);
  return nodeTypeSet.has(type);
};
