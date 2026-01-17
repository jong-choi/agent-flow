"use server";

import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodeInformation,
  sidebarNodes,
  sidebarNodesQuerySchema,
} from "@/db/schema";

const getSidebarNodesBase = async () => {
  const rows = await db
    .select({
      id: sidebarNodes.id,
      label: sidebarNodes.label,
      description: sidebarNodes.description,
      type: sidebarNodes.type,
      createdAt: sidebarNodes.createdAt,
      content: sidebarNodeContents,
      handle: sidebarNodeHandles,
      information: sidebarNodeInformation,
    })
    .from(sidebarNodes)
    .leftJoin(
      sidebarNodeContents,
      eq(sidebarNodeContents.nodeId, sidebarNodes.id),
    )
    .leftJoin(
      sidebarNodeHandles,
      eq(sidebarNodeHandles.nodeId, sidebarNodes.id),
    )
    .leftJoin(
      sidebarNodeInformation,
      eq(sidebarNodeInformation.nodeId, sidebarNodes.id),
    )
    .orderBy(sidebarNodes.createdAt);

  const parsed = z.array(sidebarNodesQuerySchema).safeParse(rows);
  if (!parsed.success) {
    console.error("Invalid sidebar nodes data:", parsed.error.issues);
    throw new Error("Invalid sidebar nodes data");
  }

  return parsed.data;
};

export const getSidebarNodes = unstable_cache(
  getSidebarNodesBase,
  ["sidebar_nodes"],
  { tags: ["sidebar_nodes"], revalidate: 60 * 60 * 24 * 30 },
);

export type SidebarNodeData = z.infer<typeof sidebarNodesQuerySchema>;

export const flowNodeDataSchema = sidebarNodesQuerySchema.omit({
  id: true,
  type: true,
});

export type FlowNodeData = Omit<SidebarNodeData, "id" | "type">;
