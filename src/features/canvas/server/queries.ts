import { cache } from "react";
import { cacheTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import "server-only";
import { z } from "zod";
import { db } from "@/db/client";
import {
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodes,
  sidebarNodesQuerySchema,
  sidebarNodesRawQuerySchema,
} from "@/db/schema";
import { type SidebarNodeData } from "@/db/types/sidebar-nodes";
import { canvasTags } from "@/features/canvas/server/cache/tags";
import { getActiveAiModels } from "@/features/chats/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { type Locale, routing } from "@/lib/i18n/routing";

const DOCUMENT_ACTION_OPTIONS = [
  { id: "read", value: "읽기" },
  { id: "merge", value: "병합" },
  { id: "replace", value: "대치" },
] as const;

const nodeTypeMessageKey = {
  startNode: "start",
  endNode: "end",
  chatNode: "chat",
  promptNode: "prompt",
  searchNode: "search",
  documentNode: "document",
  splitNode: "split",
  mergeNode: "merge",
} as const;

type SidebarNodeRawData = z.infer<typeof sidebarNodesRawQuerySchema>;

const getSidebarNodesCached = cache(async () => {
  "use cache";
  cacheTag(canvasTags.sidebarNodes());

  const rows = await db
    .select({
      id: sidebarNodes.id,
      type: sidebarNodes.type,
      order: sidebarNodes.order,
      createdAt: sidebarNodes.createdAt,
      icon: sidebarNodes.icon,
      backgroundColor: sidebarNodes.backgroundColor,
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
    .orderBy(asc(sidebarNodes.order), asc(sidebarNodes.createdAt));

  const parsed = z.array(sidebarNodesRawQuerySchema).safeParse(rows);
  if (!parsed.success) {
    console.error("Invalid sidebar nodes data:", parsed.error.issues);
    throw new Error("Invalid sidebar nodes data");
  }

  return parsed.data;
});

const localizeSidebarNodes = async ({
  nodes,
  locale,
}: {
  nodes: SidebarNodeRawData[];
  locale: Locale;
}): Promise<SidebarNodeData[]> => {
  const [tNodes, tWorkflows] = await Promise.all([
    getTranslations<AppMessageKeys>({
      locale,
      namespace: "Nodes",
    }),
    getTranslations<AppMessageKeys>({
      locale,
      namespace: "Workflows",
    }),
  ]);

  const localizedNodes = nodes.map((node) => {
    const messageKey = nodeTypeMessageKey[node.type];

    const content: SidebarNodeData["content"] = node.content
      ? {
          ...node.content,
        }
      : null;

    if (node.type === "chatNode" && content?.type === "select") {
      content.label = tWorkflows("canvas.nodePanel.labels.agent");
      content.placeholder = tWorkflows("canvas.nodePanel.placeholders.agent");
    }

    if (node.type === "documentNode" && content?.type === "select") {
      content.label = tWorkflows("canvas.nodePanel.labels.action");
      content.placeholder = tWorkflows("canvas.nodePanel.placeholders.action");
    }

    if (node.type === "promptNode" && content?.type === "dialog") {
      content.label = tWorkflows("canvas.nodePanel.labels.promptEdit");
      content.dialogTitle = tWorkflows(
        "canvas.nodePanel.labels.promptDialogTitle",
      );
      content.dialogDescription = tWorkflows(
        "canvas.nodePanel.placeholders.promptInputHint",
      );
    }

    return {
      ...node,
      label: tNodes(`node.${messageKey}.label`),
      description: tNodes(`node.${messageKey}.summary`),
      content,
      information: {
        id: node.id,
        nodeId: node.id,
        title: tNodes(`node.${messageKey}.title`),
        summary: tNodes(`node.${messageKey}.summary`),
        description: tNodes(`node.${messageKey}.description`),
        guides: [
          tNodes(`node.${messageKey}.guides.first`),
          tNodes(`node.${messageKey}.guides.second`),
          tNodes(`node.${messageKey}.guides.third`),
        ],
      },
    };
  });

  const parsed = z.array(sidebarNodesQuerySchema).safeParse(localizedNodes);
  if (!parsed.success) {
    console.error("Invalid localized sidebar nodes data:", parsed.error.issues);
    throw new Error("Invalid localized sidebar nodes data");
  }

  return parsed.data;
};

const getLocalizedSidebarNodesCached = cache(async (locale: Locale) => {
  "use cache";
  cacheTag(canvasTags.sidebarNodes(locale));

  const nodes = await getSidebarNodesCached();
  return localizeSidebarNodes({ nodes, locale });
});

export const getSidebarNodes = async (locale: Locale = routing.defaultLocale) =>
  getLocalizedSidebarNodesCached(locale);

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

const getSidebarNodesWithOptionsLocalizedCached = cache(
  async (locale: Locale) => {
    "use cache";
    cacheTag(canvasTags.sidebarNodes(locale));

    const nodes = await getLocalizedSidebarNodesCached(locale);
    return hydrateSidebarNodeOptions(nodes);
  },
);

export const getSidebarNodesWithOptions = async (locale: Locale = "en") =>
  getSidebarNodesWithOptionsLocalizedCached(locale);
