import { type z } from "zod";
import { sidebarNodesQuerySchema } from "@/db/schema";

export type SidebarNodeData = z.infer<typeof sidebarNodesQuerySchema>;

export const flowNodeDataSchema = sidebarNodesQuerySchema.omit({
  id: true,
  type: true,
});

export type FlowNodeData = Omit<SidebarNodeData, "id" | "type">;
