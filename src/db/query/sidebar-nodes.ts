"use server";

import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodes,
} from "@/db/schema";

const getSidebarNodesBase = async () => {
  return await db
    .select({
      id: sidebarNodes.id,
      label: sidebarNodes.label,
      description: sidebarNodes.description,
      type: sidebarNodes.type,
      createdAt: sidebarNodes.createdAt,
      content: sidebarNodeContents,
      handle: sidebarNodeHandles,
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
    .orderBy(sidebarNodes.createdAt);
};

export const getSidebarNodes = unstable_cache(
  getSidebarNodesBase,
  ["sidebar_nodes"],
  { tags: ["sidebar_nodes"], revalidate: 60 * 60 * 24 * 30 },
);

type SelectSidebarNode = Awaited<
  ReturnType<typeof getSidebarNodesBase>
>[number];

export type SidebarNodeData = Omit<SelectSidebarNode, "content"> & {
  content:
    | (SelectSidebarNode["content"] & {
        options?: Array<{ id: string; value: string }>;
      })
    | null;
};

export type FlowNodeData = Omit<SidebarNodeData, "id" | "type">;
