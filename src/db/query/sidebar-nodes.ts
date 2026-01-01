"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodes,
} from "@/db/schema";

export const getSidebarNodes = async () => {
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

type SelectSidebarNode = Awaited<ReturnType<typeof getSidebarNodes>>[number];

export type SidebarNodeData = Omit<SelectSidebarNode, "content"> & {
  content:
    | (SelectSidebarNode["content"] & {
        options?: Array<{ id: string; value: string }>;
      })
    | null;
};
