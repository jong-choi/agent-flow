"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { and, desc, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { type FlowEdge, type FlowNode } from "@/app/api/chat/_types/nodes";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { presetPurchases, presets, workflowPresets } from "@/db/schema/presets";
import { workflowEdges, workflowNodes, workflows } from "@/db/schema/workflows";

type WorkflowGraphInput = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  presetIds?: string[];
};

const getUniquePresetIds = (presetIds?: string[]) => {
  if (!presetIds) {
    return [];
  }

  const unique = new Set<string>();
  for (const presetId of presetIds) {
    if (presetId) {
      unique.add(presetId);
    }
  }
  return Array.from(unique);
};

const resolveAccessiblePresetIds = async ({
  tx,
  ownerId,
  presetIds,
  excludeWorkflowId,
}: {
  tx: Pick<typeof db, "select">;
  ownerId: string;
  presetIds: string[];
  excludeWorkflowId?: string;
}) => {
  if (presetIds.length === 0) {
    return [];
  }

  const clauses = [
    inArray(presets.id, presetIds),
    or(eq(presets.ownerId, ownerId), isNotNull(presetPurchases.presetId)),
  ];

  if (excludeWorkflowId) {
    clauses.push(ne(presets.workflowId, excludeWorkflowId));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);

  const rows = await tx
    .select({ id: presets.id })
    .from(presets)
    .leftJoin(
      presetPurchases,
      and(
        eq(presetPurchases.presetId, presets.id),
        eq(presetPurchases.buyerId, ownerId),
      ),
    )
    .where(whereClause);

  return rows.map((row) => row.id);
};

const buildWorkflowNodeValue = (
  node: FlowNode,
  workflowId: string,
  ownerId: string,
) => ({
  workflowId,
  ownerId,
  nodeId: node.id,
  type: node.type,
  posX: Math.round(node.position.x),
  posY: Math.round(node.position.y),
  label: node.data.label,
  description: node.data.description,
  value: node.data.content?.value ?? null,
  targetCount: node.data.handle?.targetCount ?? null,
  sourceCount: node.data.handle?.sourceCount ?? null,
});

const buildWorkflowEdgeValue = (
  edge: FlowEdge,
  workflowId: string,
  ownerId: string,
  edgeId: string,
) => ({
  workflowId,
  ownerId,
  edgeId,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle || "source",
  targetHandle: edge.targetHandle || "target",
});

const getWorkflowWithGraphBase = async (workflowId: string) => {
  const whereClause = and(eq(workflows.id, workflowId));

  const [workflow] = await db
    .select()
    .from(workflows)
    .where(whereClause)
    .limit(1);

  if (!workflow) {
    return null;
  }

  const nodes = await db
    .select()
    .from(workflowNodes)
    .where(eq(workflowNodes.workflowId, workflowId));

  const edges = await db
    .select()
    .from(workflowEdges)
    .where(eq(workflowEdges.workflowId, workflowId));

  return { workflow, nodes, edges };
};

export const getWorkflowWithGraph = async (workflowId: string) => {
  const getWorkflowWithGraphCached = unstable_cache(
    () => getWorkflowWithGraphBase(workflowId),

    ["workflow_graph", workflowId],
    {
      revalidate: 60 * 60 * 24 * 7,
      tags: [`workflow_graph:${workflowId}`],
    },
  );

  return getWorkflowWithGraphCached();
};

const getRecentWorkflowsBase = async (
  {
    limit,
    ownerId,
  }: {
    limit: number;
    ownerId: string;
  } = { limit: 6, ownerId: "" },
) => {
  if (!ownerId) {
    throw new Error("사용자 정보를 불러올 수 없습니다.");
  }
  const data = await db
    .select()
    .from(workflows)
    .where(eq(workflows.ownerId, ownerId))
    .orderBy(desc(workflows.updatedAt))
    .limit(limit + 1);

  let hasMore = false;
  if (data.length > limit) {
    hasMore = true;
  }

  return { data: data.slice(0, limit), hasMore };
};

export const getRecentWorkflows = async (
  params: {
    limit: number;
  } = { limit: 6 },
) => {
  const ownerId = await getUserId();
  const getRecentWorkflowsCached = unstable_cache(
    () => getRecentWorkflowsBase({ ...params, ownerId }),
    ["workflow_graph", ownerId, String(params.limit)],
    {
      revalidate: 60 * 60 * 24 * 7,
      tags: [`workflow_graph:list:${ownerId}`],
    },
  );

  return getRecentWorkflowsCached();
};

const getOwnedWorkflowsBase = async (ownerId: string) => {
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
};

export const getOwnedWorkflows = async () => {
  const ownerId = await getUserId();
  const getOwnedWorkflowsCached = unstable_cache(
    () => getOwnedWorkflowsBase(ownerId),
    ["workflow_graph", ownerId],
    {
      revalidate: 60 * 60 * 24 * 7,
      tags: [`workflow_graph:list:${ownerId}`],
    },
  );

  return getOwnedWorkflowsCached();
};

export const getOwnedWorkflowById = async (workflowId: string) => {
  const ownerId = await getUserId();

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
};

export const createWorkflowGraph = async ({
  title,
  description,
  nodes,
  edges,
  presetIds,
}: {
  title: string;
  description: string | null;
} & WorkflowGraphInput) => {
  const ownerId = await getUserId();
  return db.transaction(async (tx) => {
    const [workflow] = await tx
      .insert(workflows)
      .values({ ownerId, title, description })
      .returning({
        id: workflows.id,
        title: workflows.title,
        description: workflows.description,
      });

    if (!workflow) {
      throw new Error("Workflow insert failed");
    }

    const workflowId = workflow.id;

    if (nodes.length > 0) {
      await tx
        .insert(workflowNodes)
        .values(
          nodes.map((node) =>
            buildWorkflowNodeValue(node, workflowId, ownerId),
          ),
        );
    }

    if (edges.length > 0) {
      await tx.insert(workflowEdges).values(
        edges.map((edge) => {
          const edgeId = edge.id || crypto.randomUUID();
          return {
            id: crypto.randomUUID(),
            ...buildWorkflowEdgeValue(edge, workflowId, ownerId, edgeId),
          };
        }),
      );
    }

    const normalizedPresetIds = getUniquePresetIds(presetIds);
    const accessiblePresetIds = await resolveAccessiblePresetIds({
      tx,
      ownerId,
      presetIds: normalizedPresetIds,
    });
    if (accessiblePresetIds.length > 0) {
      await tx
        .insert(workflowPresets)
        .values(
          accessiblePresetIds.map((presetId) => ({
            workflowId,
            presetId,
          })),
        )
        .onConflictDoNothing();
    }

    revalidateTag(`workflow_graph:list:${ownerId}`, { expire: 0 });
    return workflow;
  });
};

export const updateWorkflowGraph = async ({
  workflowId,
  title,
  description,
  nodes,
  edges,
  presetIds,
}: {
  workflowId: string;
  title: string;
  description: string | null;
} & WorkflowGraphInput) => {
  const ownerId = await getUserId();
  return db.transaction(async (tx) => {
    const [workflow] = await tx
      .update(workflows)
      .set({ title, description, updatedAt: new Date() })
      .where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId)))
      .returning({
        id: workflows.id,
        title: workflows.title,
        description: workflows.description,
      });

    if (!workflow) {
      return null;
    }

    const existingNodes = await tx
      .select({ id: workflowNodes.id, nodeId: workflowNodes.nodeId })
      .from(workflowNodes)
      .where(eq(workflowNodes.workflowId, workflowId));

    const existingEdges = await tx
      .select({ id: workflowEdges.id, edgeId: workflowEdges.edgeId })
      .from(workflowEdges)
      .where(eq(workflowEdges.workflowId, workflowId));

    const existingNodeMap = new Map(
      existingNodes.map((node) => [node.nodeId, node.id]),
    );
    const existingEdgeMap = new Map(
      existingEdges.map((edge) => [edge.edgeId, edge.id]),
    );

    const nextNodeIds = new Set<string>();
    const nextEdgeIds = new Set<string>();

    for (const node of nodes) {
      nextNodeIds.add(node.id);
      const payload = buildWorkflowNodeValue(node, workflowId, ownerId);
      const existingId = existingNodeMap.get(node.id);

      if (existingId) {
        await tx
          .update(workflowNodes)
          .set(payload)
          .where(eq(workflowNodes.id, existingId));
      } else {
        await tx.insert(workflowNodes).values(payload);
      }
    }

    for (const edge of edges) {
      const edgeId = edge.id || crypto.randomUUID();
      nextEdgeIds.add(edgeId);
      const payload = buildWorkflowEdgeValue(edge, workflowId, ownerId, edgeId);
      const existingId = existingEdgeMap.get(edgeId);

      if (existingId) {
        await tx
          .update(workflowEdges)
          .set(payload)
          .where(eq(workflowEdges.id, existingId));
      } else {
        await tx.insert(workflowEdges).values({
          id: crypto.randomUUID(),
          ...payload,
        });
      }
    }

    const removedNodeIds = existingNodes
      .filter((node) => !nextNodeIds.has(node.nodeId))
      .map((node) => node.id);

    if (removedNodeIds.length > 0) {
      await tx
        .delete(workflowNodes)
        .where(inArray(workflowNodes.id, removedNodeIds));
    }

    const removedEdgeIds = existingEdges
      .filter((edge) => !nextEdgeIds.has(edge.edgeId))
      .map((edge) => edge.id);

    if (removedEdgeIds.length > 0) {
      await tx
        .delete(workflowEdges)
        .where(inArray(workflowEdges.id, removedEdgeIds));
    }

    const normalizedPresetIds = getUniquePresetIds(presetIds);
    const accessiblePresetIds = await resolveAccessiblePresetIds({
      tx,
      ownerId,
      presetIds: normalizedPresetIds,
      excludeWorkflowId: workflowId,
    });

    const existingPresets = await tx
      .select({ presetId: workflowPresets.presetId })
      .from(workflowPresets)
      .where(eq(workflowPresets.workflowId, workflowId));

    const existingPresetSet = new Set(
      existingPresets.map((row) => row.presetId),
    );
    const nextPresetSet = new Set(accessiblePresetIds);

    const presetIdsToInsert = accessiblePresetIds.filter(
      (presetId) => !existingPresetSet.has(presetId),
    );
    if (presetIdsToInsert.length > 0) {
      await tx
        .insert(workflowPresets)
        .values(
          presetIdsToInsert.map((presetId) => ({
            workflowId,
            presetId,
          })),
        )
        .onConflictDoNothing();
    }

    const presetIdsToRemove = existingPresets
      .map((row) => row.presetId)
      .filter((presetId) => !nextPresetSet.has(presetId));

    if (presetIdsToRemove.length > 0) {
      await tx
        .delete(workflowPresets)
        .where(
          and(
            eq(workflowPresets.workflowId, workflowId),
            inArray(workflowPresets.presetId, presetIdsToRemove),
          ),
        );
    }

    revalidateTag(`workflow_graph:${workflowId}`, { expire: 0 });
    revalidateTag(`workflow_graph:list:${ownerId}`, { expire: 0 });

    return workflow;
  });
};
