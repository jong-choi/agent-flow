"use server";

import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { getActiveAiModels } from "@/db/query/ai-models";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodeInformation,
  sidebarNodes,
  sidebarNodesQuerySchema,
} from "@/db/schema";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";

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

const hydrateSidebarNodeOptions = async (
  nodes: SidebarNodeData[],
): Promise<SidebarNodeData[]> => {
  const needsAiModels = nodes.some(
    (node) =>
      node.content?.type === "select" &&
      node.content.optionsSource === "ai_models",
  );

  const aiModelOptions = needsAiModels
    ? (await getActiveAiModels()).map((aiModel) => ({
        id: aiModel.id,
        value: aiModel.modelId,
      }))
    : null;

  return nodes.map((node) => {
    if (
      node.content?.type === "select" &&
      node.content.optionsSource === "ai_models"
    ) {
      return {
        ...node,
        content: {
          ...node.content,
          options: aiModelOptions ?? [],
        },
      };
    }

    return node;
  });
};

export const getSidebarNodesWithOptions = async () => {
  const nodes = await getSidebarNodes();
  return hydrateSidebarNodeOptions(nodes);
};
