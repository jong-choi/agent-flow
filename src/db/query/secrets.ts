"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { userSecrets, workflowApiIds, workflows } from "@/db/schema";

const USER_SECRET_PREFIX = "lc-";
const WORKFLOW_CANVAS_ID_PREFIX = "lc-id-";

const USER_SECRET_NANOID_LENGTH = 22;
const WORKFLOW_CANVAS_ID_NANOID_LENGTH = 19;

const maskAfterPrefix = (secret: string, visibleChars = 2) => {
  const prefix = secret.startsWith(WORKFLOW_CANVAS_ID_PREFIX)
    ? WORKFLOW_CANVAS_ID_PREFIX
    : secret.startsWith(USER_SECRET_PREFIX)
      ? USER_SECRET_PREFIX
      : "";

  const remainder = secret.slice(prefix.length);
  const exposed = remainder.slice(0, visibleChars);
  const masked = "*".repeat(Math.max(remainder.length - visibleChars, 0));
  return `${prefix}${exposed}${masked}`;
};

const buildUserSecret = () => `${USER_SECRET_PREFIX}${nanoid(USER_SECRET_NANOID_LENGTH)}`;
const buildWorkflowCanvasId = () =>
  `${WORKFLOW_CANVAS_ID_PREFIX}${nanoid(WORKFLOW_CANVAS_ID_NANOID_LENGTH)}`;

const sha256Hex = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

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
          set: { canvasId: nextCanvasId, deletedAt: null, createdAt: new Date() },
        })
        .returning({
          canvasId: workflowApiIds.canvasId,
          createdAt: workflowApiIds.createdAt,
        });

      if (!upserted?.canvasId) {
        throw new Error("워크플로우 ID 발급에 실패했습니다.");
      }

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
      and(eq(workflowApiIds.workflowId, workflowId), isNull(workflowApiIds.deletedAt)),
    )
    .returning({ workflowId: workflowApiIds.workflowId });

  if (!deleted) {
    throw new Error("워크플로우 ID 삭제에 실패했습니다.");
  }

  return deleted;
};

/**
 * API 요청 헤더의 X-CANVAS-SECRET으로 사용자 식별.
 * - 유효한 경우 lastUsedAt 업데이트 후 userId 반환
 */
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

/**
 * API 요청 헤더의 X-CANVAS-ID로 워크플로우 식별.
 * - 워크플로우 ownerId도 함께 반환한다.
 */
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
