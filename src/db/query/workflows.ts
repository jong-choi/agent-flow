"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { type FlowEdge, type FlowNode } from "@/app/api/chat/_types/nodes";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { workflowEdges, workflowNodes, workflows } from "@/db/schema/workflows";

type WorkflowGraphInput = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

const normalizeHandle = (value: string | null | undefined, fallback: string) =>
  value ?? fallback;

const resolveEdgeId = (edge: FlowEdge) => edge.id ?? crypto.randomUUID();

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
  sourceHandle: normalizeHandle(edge.sourceHandle, "source"),
  targetHandle: normalizeHandle(edge.targetHandle, "target"),
});

export const getWorkflowWithGraph = async (
  workflowId: string,
  ownerId?: string,
) => {
  const whereClause = ownerId
    ? and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId))
    : eq(workflows.id, workflowId);

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

export const getRecentWorkflows = async (
  {
    limit,
  }: {
    limit: number;
  } = { limit: 6 },
) => {
  const ownerId = await getUserId();

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

export const createWorkflowGraph = async ({
  ownerId,
  title,
  description,
  nodes,
  edges,
}: {
  ownerId: string;
  title: string;
  description: string | null;
} & WorkflowGraphInput) => {
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
          const edgeId = resolveEdgeId(edge);
          return {
            id: crypto.randomUUID(),
            ...buildWorkflowEdgeValue(edge, workflowId, ownerId, edgeId),
          };
        }),
      );
    }

    return workflow;
  });
};

export const updateWorkflowGraph = async ({
  ownerId,
  workflowId,
  title,
  description,
  nodes,
  edges,
}: {
  ownerId: string;
  workflowId: string;
  title: string;
  description: string | null;
} & WorkflowGraphInput) => {
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
      const edgeId = resolveEdgeId(edge);
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

    return workflow;
  });
};
