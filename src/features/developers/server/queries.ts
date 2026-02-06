import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { userSecrets, workflowApiIds, workflows } from "@/db/schema";
import { sha256Hex } from "@/features/developers/server/utils";

export type UserSecretSummary = {
  id: string;
  preview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export const getUserSecrets = async (): Promise<UserSecretSummary[]> => {
  const userId = await getUserId();
  return db
    .select({
      id: userSecrets.id,
      preview: userSecrets.preview,
      createdAt: userSecrets.createdAt,
      lastUsedAt: userSecrets.lastUsedAt,
    })
    .from(userSecrets)
    .where(and(eq(userSecrets.userId, userId), isNull(userSecrets.deletedAt)))
    .orderBy(desc(userSecrets.createdAt));
};

export const getUserIdByCanvasSecret = async ({
  secret,
}: {
  secret: string;
}): Promise<string | null> => {
  const trimmed = secret.trim();
  if (!trimmed) {
    return null;
  }

  const secretHash = await sha256Hex(trimmed);

  const [row] = await db
    .select({ id: userSecrets.id, userId: userSecrets.userId })
    .from(userSecrets)
    .where(and(eq(userSecrets.secretHash, secretHash), isNull(userSecrets.deletedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  await db
    .update(userSecrets)
    .set({ lastUsedAt: new Date() })
    .where(eq(userSecrets.id, row.id));

  return row.userId;
};

export const getWorkflowByCanvasId = async ({
  canvasId,
}: {
  canvasId: string;
}): Promise<{ workflowId: string; ownerId: string } | null> => {
  const trimmed = canvasId.trim();
  if (!trimmed) {
    return null;
  }

  const [row] = await db
    .select({
      workflowId: workflows.id,
      ownerId: workflows.ownerId,
      deletedAt: workflowApiIds.deletedAt,
    })
    .from(workflowApiIds)
    .innerJoin(workflows, eq(workflows.id, workflowApiIds.workflowId))
    .where(and(eq(workflowApiIds.canvasId, trimmed), isNull(workflows.deletedAt)))
    .limit(1);

  if (!row || row.deletedAt) {
    return null;
  }

  return { workflowId: row.workflowId, ownerId: row.ownerId };
};
