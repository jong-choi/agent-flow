import { cacheTag } from "next/cache";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import {
  buildCursorOrderBy,
  buildCursorWhere,
  type CursorOptions,
  toCursorTimestamp,
} from "@/db/query/cursor";
import { userSecrets, workflowApiIds, workflows } from "@/db/schema";
import { getUserId } from "@/features/auth/server/queries";
import { developerTags } from "@/features/developers/server/cache/tags";
import { sha256Hex } from "@/features/developers/server/utils";

export type UserSecretSummary = {
  id: string;
  preview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export type UserSecretPage = {
  items: UserSecretSummary[];
  totalCount: number;
  pageInfo: {
    hasNext: boolean;
    nextCursor: string | null;
  };
};

export const getUserSecrets = async (): Promise<UserSecretSummary[]> => {
  const userId = await getUserId();
  return getUserSecretsCached(userId);
};

const getUserSecretsCached = cache(async (
  userId: string,
): Promise<UserSecretSummary[]> => {
  "use cache";
  cacheTag(developerTags.secretsByUser(userId));

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
});

export const getUserSecretsPage = async (
  options?: CursorOptions,
): Promise<UserSecretPage> => {
  const userId = await getUserId();
  const cursor = options?.cursor?.trim() ?? "";
  const limitValue = typeof options?.limit === "number" ? options.limit : 20;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getUserSecretsPageCached(userId, cursor, limit);
};

const getUserSecretsPageCached = cache(async (
  userId: string,
  cursor: string,
  limit: number,
): Promise<UserSecretPage> => {
  "use cache";
  cacheTag(developerTags.secretsByUser(userId));

  const whereClause = and(
    eq(userSecrets.userId, userId),
    isNull(userSecrets.deletedAt),
  );
  if (!whereClause) {
    return {
      items: [],
      totalCount: 0,
      pageInfo: { hasNext: false, nextCursor: null },
    };
  }

  let cursorAnchor: { id: string; createdAt: string } | null = null;
  if (cursor) {
    const [row] = await db
      .select({
        id: userSecrets.id,
        createdAt: toCursorTimestamp(userSecrets.createdAt),
      })
      .from(userSecrets)
      .where(and(whereClause, eq(userSecrets.id, cursor)))
      .limit(1);
    cursorAnchor = row ?? null;
  }

  const orderBy = buildCursorOrderBy(
    [
      { value: userSecrets.createdAt, direction: "desc" },
      { value: userSecrets.id, direction: "desc" },
    ],
    "next",
  );

  let listWhere = whereClause;
  if (cursorAnchor) {
    const cursorWhere = buildCursorWhere(
      [
        {
          value: userSecrets.createdAt,
          cursor: cursorAnchor.createdAt,
          direction: "desc",
        },
        { value: userSecrets.id, cursor: cursorAnchor.id, direction: "desc" },
      ],
      "next",
    );
    if (cursorWhere) {
      const mergedWhere = and(whereClause, cursorWhere);
      if (mergedWhere) {
        listWhere = mergedWhere;
      }
    }
  }

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: userSecrets.id,
        preview: userSecrets.preview,
        createdAt: userSecrets.createdAt,
        lastUsedAt: userSecrets.lastUsedAt,
      })
      .from(userSecrets)
      .where(listWhere)
      .orderBy(...orderBy)
      .limit(limit + 1),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(userSecrets)
      .where(whereClause),
  ]);

  const hasNext = rows.length > limit;
  const items = rows.slice(0, limit);
  const nextCursor = hasNext ? items[items.length - 1]?.id ?? null : null;

  return {
    items,
    totalCount: countRow?.count ?? 0,
    pageInfo: {
      hasNext,
      nextCursor,
    },
  };
});

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
    .where(
      and(
        eq(userSecrets.secretHash, secretHash),
        isNull(userSecrets.deletedAt),
      ),
    )
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

  return getWorkflowByCanvasIdCached(trimmed);
};

const getWorkflowByCanvasIdCached = cache(async (
  canvasId: string,
): Promise<{ workflowId: string; ownerId: string } | null> => {
  "use cache";
  cacheTag(developerTags.workflowCanvasLookupAll());
  cacheTag(developerTags.workflowCanvasLookupByCanvas(canvasId));

  const [row] = await db
    .select({
      workflowId: workflows.id,
      ownerId: workflows.ownerId,
      deletedAt: workflowApiIds.deletedAt,
    })
    .from(workflowApiIds)
    .innerJoin(workflows, eq(workflows.id, workflowApiIds.workflowId))
    .where(
      and(eq(workflowApiIds.canvasId, canvasId), isNull(workflows.deletedAt)),
    )
    .limit(1);

  if (!row || row.deletedAt) {
    return null;
  }

  cacheTag(developerTags.workflowCanvasByWorkflow(row.workflowId));

  return { workflowId: row.workflowId, ownerId: row.ownerId };
});
