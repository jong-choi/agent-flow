"use server";

import { updateTag } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { userSecrets, workflowApiIds, workflows } from "@/db/schema";
import { getUserId } from "@/features/auth/server/queries";
import { developerTags } from "@/features/developers/server/cache/tags";
import {
  buildUserSecret,
  buildWorkflowCanvasId,
  maskAfterPrefix,
  sha256Hex,
} from "@/features/developers/server/utils";

const updateSecretTags = (userId: string) => {
  updateTag(developerTags.secretsByUser(userId));
};

const updateWorkflowCanvasTags = (workflowId: string) => {
  updateTag(developerTags.workflowCanvasByWorkflow(workflowId));
  updateTag(developerTags.workflowCanvasLookupAll());
};

export const createUserSecretAction = async () => {
  const userId = await getUserId();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const secret = buildUserSecret();
    const preview = maskAfterPrefix(secret, 2);
    const secretHash = await sha256Hex(secret);

    try {
      const [created] = await db
        .insert(userSecrets)
        .values({ userId, preview, secretHash })
        .returning({
          id: userSecrets.id,
          preview: userSecrets.preview,
          createdAt: userSecrets.createdAt,
        });

      if (!created) {
        throw new Error("시크릿 키 발급에 실패했습니다.");
      }

      updateSecretTags(userId);

      return { ...created, secret };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("duplicate")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("시크릿 키 발급에 실패했습니다.");
};

export const softDeleteUserSecretAction = async ({
  secretId,
}: {
  secretId: string;
}) => {
  const userId = await getUserId();
  const now = new Date();

  const [deleted] = await db
    .update(userSecrets)
    .set({ deletedAt: now })
    .where(
      and(
        eq(userSecrets.id, secretId),
        eq(userSecrets.userId, userId),
        isNull(userSecrets.deletedAt),
      ),
    )
    .returning({ id: userSecrets.id });

  if (!deleted) {
    throw new Error("시크릿 키 삭제에 실패했습니다.");
  }

  updateSecretTags(userId);

  return deleted;
};

export const issueWorkflowCanvasIdAction = async ({
  workflowId,
  rotate = false,
}: {
  workflowId: string;
  rotate?: boolean;
}) => {
  const userId = await getUserId();

  const [workflow] = await db
    .select({ id: workflows.id, ownerId: workflows.ownerId })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), isNull(workflows.deletedAt)))
    .limit(1);

  if (!workflow) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }

  if (workflow.ownerId !== userId) {
    throw new Error("워크플로우에 대한 접근 권한이 없습니다.");
  }

  if (!rotate) {
    const [existing] = await db
      .select({
        canvasId: workflowApiIds.canvasId,
        createdAt: workflowApiIds.createdAt,
        deletedAt: workflowApiIds.deletedAt,
      })
      .from(workflowApiIds)
      .where(eq(workflowApiIds.workflowId, workflowId))
      .limit(1);

    if (existing?.canvasId && !existing.deletedAt) {
      return { canvasId: existing.canvasId, createdAt: existing.createdAt };
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const nextCanvasId = buildWorkflowCanvasId();
    try {
      const [upserted] = await db
        .insert(workflowApiIds)
        .values({ workflowId, canvasId: nextCanvasId })
        .onConflictDoUpdate({
          target: workflowApiIds.workflowId,
          set: {
            canvasId: nextCanvasId,
            deletedAt: null,
            createdAt: new Date(),
          },
        })
        .returning({
          canvasId: workflowApiIds.canvasId,
          createdAt: workflowApiIds.createdAt,
        });

      if (!upserted?.canvasId) {
        throw new Error("워크플로우 ID 발급에 실패했습니다.");
      }

      updateWorkflowCanvasTags(workflowId);

      return { canvasId: upserted.canvasId, createdAt: upserted.createdAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("duplicate")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("워크플로우 ID 발급에 실패했습니다.");
};

export const softDeleteWorkflowCanvasIdAction = async ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const userId = await getUserId();
  const now = new Date();

  const [workflow] = await db
    .select({ id: workflows.id, ownerId: workflows.ownerId })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), isNull(workflows.deletedAt)))
    .limit(1);

  if (!workflow) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }

  if (workflow.ownerId !== userId) {
    throw new Error("워크플로우에 대한 접근 권한이 없습니다.");
  }

  const [deleted] = await db
    .update(workflowApiIds)
    .set({ deletedAt: now })
    .where(
      and(
        eq(workflowApiIds.workflowId, workflowId),
        isNull(workflowApiIds.deletedAt),
      ),
    )
    .returning({ workflowId: workflowApiIds.workflowId });

  if (!deleted) {
    throw new Error("워크플로우 ID 삭제에 실패했습니다.");
  }

  updateWorkflowCanvasTags(workflowId);

  return deleted;
};
