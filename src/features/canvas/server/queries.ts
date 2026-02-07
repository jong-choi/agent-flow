import { cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/db/client";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodeInformation,
  sidebarNodes,
  sidebarNodesQuerySchema,
} from "@/db/schema";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { canvasTags } from "@/features/canvas/server/cache/tags";
import { getActiveAiModels } from "@/features/chats/server/queries";

const DOCUMENT_ACTION_OPTIONS = [
  { id: "read", value: "읽기" },
  { id: "merge", value: "병합" },
  { id: "replace", value: "대치" },
] as const;

const getSidebarNodesCached = cache(async () => {
  "use cache";
  cacheTag(canvasTags.sidebarNodes());

  const rows = await db
    .select({
      id: sidebarNodes.id,
      label: sidebarNodes.label,
      description: sidebarNodes.description,
      type: sidebarNodes.type,
      createdAt: sidebarNodes.createdAt,
      icon: sidebarNodes.icon,
      backgroundColor: sidebarNodes.backgroundColor,
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
});

export const getSidebarNodes = async () => getSidebarNodesCached();

const getActiveAiModelOptionsCached = cache(async () => {
  "use cache";
  cacheTag(canvasTags.activeAiModels());

  return (await getActiveAiModels()).map((aiModel) => ({
    id: aiModel.id,
    value: aiModel.modelId,
    price: aiModel.price ?? 0,
  }));
});

const hydrateSidebarNodeOptions = async (
  nodes: SidebarNodeData[],
): Promise<SidebarNodeData[]> => {
  const needsAiModels = nodes.some(
    (node) =>
      node.content?.type === "select" &&
      node.content.optionsSource === "ai_models",
  );

  const aiModelOptions = needsAiModels
    ? await getActiveAiModelOptionsCached()
    : null;

  return nodes.map((node) => {
    if (node.type === "documentNode" && node.content?.type === "select") {
      return {
        ...node,
        content: {
          ...node.content,
          options: [...DOCUMENT_ACTION_OPTIONS],
        },
      };
    }

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

const getSidebarNodesWithOptionsCached = cache(async () => {
  "use cache";
  cacheTag(canvasTags.sidebarNodes());

  const nodes = await getSidebarNodesCached();
  return hydrateSidebarNodeOptions(nodes);
});

export const getSidebarNodesWithOptions = async () =>
  getSidebarNodesWithOptionsCached();
