import { z } from "zod";
import { flowEdgeSchema, flowNodeSchema } from "@/app/api/chat/_types/nodes";

export const workflowSaveSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  presetIds: z.array(z.uuid()).optional(),
});

export type WorkflowSaveRequest = z.infer<typeof workflowSaveSchema>;
