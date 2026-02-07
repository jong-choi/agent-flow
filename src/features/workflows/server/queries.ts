import { cacheTag } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { getUserId } from "@/features/auth/server/queries";
import { aiModels } from "@/db/schema/ai-models";
import { workflowEdges, workflowNodes, workflows } from "@/db/schema/workflows";
import { chatTags } from "@/features/chats/server/cache/tags";
import { workflowTags } from "@/features/workflows/server/cache/tags";

const normalizeLimit = (limit: number | undefined, fallback = 6) => {
  const parsed = typeof limit === "number" ? Math.trunc(limit) : fallback;
  return Math.max(1, parsed);
};

export const getWorkflowWithGraph = async (workflowId: string) => {
  const trimmedWorkflowId = workflowId.trim();
  if (!trimmedWorkflowId) {
    return null;
  }

  return getWorkflowWithGraphCached(trimmedWorkflowId);
};

const getWorkflowWithGraphCached = cache(async (workflowId: string) => {
  "use cache";
  cacheTag(workflowTags.graphByWorkflow(workflowId));
  cacheTag(workflowTags.metaByWorkflow(workflowId));

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) {
    return null;
  }

  const [nodes, edges] = await Promise.all([
    db
      .select()
      .from(workflowNodes)
      .where(eq(workflowNodes.workflowId, workflowId)),
    db
      .select()
      .from(workflowEdges)
      .where(eq(workflowEdges.workflowId, workflowId)),
  ]);

  return { workflow, nodes, edges };
});

export const getRecentWorkflows = async (
  params: {
    limit: number;
  } = { limit: 6 },
) => {
  const ownerId = await getUserId();
  const safeLimit = normalizeLimit(params.limit);

  return getRecentWorkflowsCached(ownerId, safeLimit);
};

const getRecentWorkflowsCached = cache(async (ownerId: string, limit: number) => {
  "use cache";
  cacheTag(workflowTags.allByUser(ownerId));
  cacheTag(workflowTags.listByUser(ownerId));
  cacheTag(workflowTags.recentByUser(ownerId));

  const data = await db
    .select()
    .from(workflows)
    .where(eq(workflows.ownerId, ownerId))
    .orderBy(desc(workflows.updatedAt))
    .limit(limit + 1);

  const hasMore = data.length > limit;
  return { data: data.slice(0, limit), hasMore };
});

export const getOwnedWorkflows = async () => {
  const ownerId = await getUserId();
  return getOwnedWorkflowsCached(ownerId);
};

const getOwnedWorkflowsCached = cache(async (ownerId: string) => {
  "use cache";
  cacheTag(workflowTags.allByUser(ownerId));
  cacheTag(workflowTags.listByUser(ownerId));

  return db
    .select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(eq(workflows.ownerId, ownerId))
    .orderBy(desc(workflows.updatedAt));
});

export const getOwnedWorkflowById = async (workflowId: string) => {
  const ownerId = await getUserId();
  const trimmedWorkflowId = workflowId.trim();
  if (!trimmedWorkflowId) {
    return null;
  }

  return getOwnedWorkflowByIdCached(ownerId, trimmedWorkflowId);
};

const getOwnedWorkflowByIdCached = cache(async (
  ownerId: string,
  workflowId: string,
) => {
  "use cache";
  cacheTag(workflowTags.allByUser(ownerId));
  cacheTag(workflowTags.listByUser(ownerId));
  cacheTag(workflowTags.metaByWorkflow(workflowId));
  cacheTag(workflowTags.graphByWorkflow(workflowId));

  const [workflow] = await db
    .select({
      id: workflows.id,
      title: workflows.title,
      description: workflows.description,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId)))
    .limit(1);

  return workflow ?? null;
});

export const getOwnedWorkflowChatCreditEstimate = async (workflowId: string) => {
  const ownerId = await getUserId();
  const trimmedWorkflowId = workflowId.trim();

  if (!trimmedWorkflowId) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }

  const [workflow] = await db
    .select({ ownerId: workflows.ownerId })
    .from(workflows)
    .where(eq(workflows.id, trimmedWorkflowId))
    .limit(1);

  if (!workflow) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }

  if (workflow.ownerId !== ownerId) {
    throw new Error("워크플로우에 대한 접근 권한이 없습니다.");
  }

  return getOwnedWorkflowChatCreditEstimateCached(trimmedWorkflowId);
};

const getOwnedWorkflowChatCreditEstimateCached = cache(async (workflowId: string) => {
  "use cache";
  cacheTag(workflowTags.graphByWorkflow(workflowId));
  cacheTag(workflowTags.metaByWorkflow(workflowId));
  cacheTag(chatTags.activeAiModels());

  const totalSql = sql<number>`
    coalesce(sum(coalesce(${aiModels.price}, 0)), 0)
  `.mapWith(Number);

  const [row] = await db
    .select({ total: totalSql })
    .from(workflowNodes)
    .leftJoin(aiModels, eq(workflowNodes.value, aiModels.modelId))
    .where(
      and(eq(workflowNodes.workflowId, workflowId), eq(workflowNodes.type, "chatNode")),
    )
    .limit(1);

  return row?.total ?? 0;
});
