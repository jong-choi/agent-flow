import { cacheTag } from "next/cache";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import {
  buildCursorOrderBy,
  buildCursorWhere,
  type CursorOptions,
  toCursorTimestamp,
} from "@/db/query/cursor";
import { documents } from "@/db/schema/documents";
import { getUserId } from "@/features/auth/server/queries";
import { documentTags } from "@/features/documents/server/cache/tags";

type DocumentListFilters = {
  query?: string;
  sort?: "recent" | "latest" | "oldest" | "name";
};

export type DocumentsPageResult = {
  documents: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  totalCount: number;
  pageInfo: {
    hasPrev: boolean;
    hasNext: boolean;
    prevCursor: string | null;
    nextCursor: string | null;
  };
};

export const getDocumentsByOwner = async (
  filters?: DocumentListFilters,
  options?: CursorOptions,
) => {
  const ownerId = await getUserId();
  const query = filters?.query?.trim() ?? "";
  const sort = filters?.sort ?? "recent";
  const cursor = options?.cursor?.trim() ?? "";
  const dir = options?.dir === "prev" ? "prev" : "next";
  const limitValue = typeof options?.limit === "number" ? options.limit : 20;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getDocumentsByOwnerCached(
    ownerId,
    query,
    sort,
    cursor,
    dir,
    limit,
  );
};

const getDocumentsByOwnerCached = cache(async (
  ownerId: string,
  query: string,
  sort: "recent" | "latest" | "oldest" | "name",
  cursor: string,
  dir: "next" | "prev",
  limit: number,
) => {
  "use cache";
  cacheTag(documentTags.allByUser(ownerId));
  cacheTag(documentTags.listByUser(ownerId));

  const clauses = [eq(documents.ownerId, ownerId), isNull(documents.deletedAt)];

  if (query) {
    clauses.push(ilike(documents.title, `%${query}%`));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);

  let cursorAnchor:
    | {
        id: string;
        title: string | null;
        createdAt: string | null;
        updatedAt: string | null;
      }
    | null = null;

  if (cursor) {
    const [anchor] = await db
      .select({
        id: documents.id,
        title: documents.title,
        createdAt: toCursorTimestamp(documents.createdAt),
        updatedAt: toCursorTimestamp(documents.updatedAt),
      })
      .from(documents)
      .where(and(whereClause, eq(documents.id, cursor)))
      .limit(1);
    cursorAnchor = anchor ?? null;
  }

  const sortFields =
    sort === "name"
      ? [
          { value: documents.title, direction: "asc" as const },
          { value: documents.id, direction: "asc" as const },
        ]
      : sort === "latest"
        ? [
            { value: documents.createdAt, direction: "desc" as const },
            { value: documents.id, direction: "desc" as const },
          ]
        : sort === "oldest"
          ? [
              { value: documents.createdAt, direction: "asc" as const },
              { value: documents.id, direction: "asc" as const },
            ]
          : [
              { value: documents.updatedAt, direction: "desc" as const },
              { value: documents.id, direction: "desc" as const },
            ];

  const appliedDir = cursorAnchor && dir === "prev" ? "prev" : "next";
  const orderBy = buildCursorOrderBy(sortFields, appliedDir);

  let listWhere = whereClause;
  if (cursorAnchor) {
    const cursorWhere =
      sort === "name"
        ? buildCursorWhere(
            [
              {
                value: documents.title,
                cursor: cursorAnchor.title ?? "",
                direction: "asc",
              },
              { value: documents.id, cursor: cursorAnchor.id, direction: "asc" },
            ],
            appliedDir,
          )
        : sort === "latest"
          ? buildCursorWhere(
              [
                {
                  value: documents.createdAt,
                  cursor: cursorAnchor.createdAt ?? "",
                  direction: "desc",
                },
                { value: documents.id, cursor: cursorAnchor.id, direction: "desc" },
              ],
              appliedDir,
            )
          : sort === "oldest"
            ? buildCursorWhere(
                [
                  {
                    value: documents.createdAt,
                    cursor: cursorAnchor.createdAt ?? "",
                    direction: "asc",
                  },
                  {
                    value: documents.id,
                    cursor: cursorAnchor.id,
                    direction: "asc",
                  },
                ],
                appliedDir,
              )
            : buildCursorWhere(
                [
                  {
                    value: documents.updatedAt,
                    cursor: cursorAnchor.updatedAt ?? "",
                    direction: "desc",
                  },
                  { value: documents.id, cursor: cursorAnchor.id, direction: "desc" },
                ],
                appliedDir,
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
        id: documents.id,
        title: documents.title,
        content: documents.content,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(listWhere)
      .orderBy(...orderBy)
      .limit(limit + 1),
    db
      .select({
        totalCount: sql<number>`count(*)`.mapWith(Number),
      })
      .from(documents)
      .where(whereClause),
  ]);

  const hasMore = rows.length > limit;
  const slicedRows = rows.slice(0, limit);
  const documentsList =
    appliedDir === "prev" ? [...slicedRows].reverse() : slicedRows;
  const hasPrev = appliedDir === "prev" ? hasMore : Boolean(cursorAnchor);
  const hasNext = appliedDir === "prev" ? Boolean(cursorAnchor) : hasMore;
  const prevCursor = hasPrev ? documentsList[0]?.id ?? null : null;
  const nextCursor = hasNext
    ? documentsList[documentsList.length - 1]?.id ?? null
    : null;

  return {
    documents: documentsList,
    totalCount: countRow?.totalCount ?? 0,
    pageInfo: {
      hasPrev,
      hasNext,
      prevCursor,
      nextCursor,
    },
  };
});

export type DocumentSearchResult = {
  id: string;
  title: string;
  content: string;
};

export type RecentDocumentsForPickerPage = {
  items: DocumentSearchResult[];
  pageInfo: {
    hasNext: boolean;
    nextCursor: string | null;
  };
};

export const searchDocumentsByTitle = cache(async (
  query: string,
  limit = 6,
): Promise<DocumentSearchResult[]> => {
  const userId = await getUserId();

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  return db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
    })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, userId),
        ilike(documents.title, `%${trimmedQuery}%`),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(desc(documents.updatedAt))
    .limit(safeLimit);
});

export const getRecentDocumentsForPicker = async (
  limit = 6,
): Promise<DocumentSearchResult[]> => {
  const userId = await getUserId();
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  return getRecentDocumentsForPickerCached(userId, safeLimit);
};

const getRecentDocumentsForPickerCached = cache(async (
  userId: string,
  safeLimit: number,
): Promise<DocumentSearchResult[]> => {
  "use cache";
  cacheTag(documentTags.allByUser(userId));
  cacheTag(documentTags.pickerByUser(userId));

  return db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
    })
    .from(documents)
    .where(and(eq(documents.ownerId, userId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt))
    .limit(safeLimit);
});

export const getRecentDocumentsForPickerPage = async (
  options?: CursorOptions,
): Promise<RecentDocumentsForPickerPage> => {
  const userId = await getUserId();
  const cursor = options?.cursor?.trim() ?? "";
  const limitValue = typeof options?.limit === "number" ? options.limit : 20;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getRecentDocumentsForPickerPageCached(userId, cursor, limit);
};

const getRecentDocumentsForPickerPageCached = cache(async (
  userId: string,
  cursor: string,
  limit: number,
): Promise<RecentDocumentsForPickerPage> => {
  "use cache";
  cacheTag(documentTags.allByUser(userId));
  cacheTag(documentTags.pickerByUser(userId));

  const whereClause = and(eq(documents.ownerId, userId), isNull(documents.deletedAt));
  if (!whereClause) {
    return {
      items: [],
      pageInfo: {
        hasNext: false,
        nextCursor: null,
      },
    };
  }

  let cursorAnchor: { id: string; updatedAt: string } | null = null;
  if (cursor) {
    const [anchor] = await db
      .select({
        id: documents.id,
        updatedAt: toCursorTimestamp(documents.updatedAt),
      })
      .from(documents)
      .where(and(whereClause, eq(documents.id, cursor)))
      .limit(1);
    cursorAnchor = anchor ?? null;
  }

  const orderBy = buildCursorOrderBy(
    [
      { value: documents.updatedAt, direction: "desc" },
      { value: documents.id, direction: "desc" },
    ],
    "next",
  );

  let listWhere = whereClause;
  if (cursorAnchor) {
    const cursorWhere = buildCursorWhere(
      [
        {
          value: documents.updatedAt,
          cursor: cursorAnchor.updatedAt,
          direction: "desc",
        },
        { value: documents.id, cursor: cursorAnchor.id, direction: "desc" },
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

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
    })
    .from(documents)
    .where(listWhere)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = rows.slice(0, limit);
  const nextCursor = hasNext ? items[items.length - 1]?.id ?? null : null;

  return {
    items,
    pageInfo: {
      hasNext,
      nextCursor,
    },
  };
});

export const getDocumentTitleById = async ({
  docId,
}: {
  docId: string;
}): Promise<string | null> => {
  const ownerId = await getUserId();
  return getDocumentTitleByIdCached(ownerId, docId);
};

const getDocumentTitleByIdCached = cache(async (
  ownerId: string,
  docId: string,
): Promise<string | null> => {
  "use cache";
  cacheTag(documentTags.allByUser(ownerId));
  cacheTag(documentTags.detailByUserAndDoc(ownerId, docId));

  const [document] = await db
    .select({ title: documents.title })
    .from(documents)
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .limit(1);

  return document?.title ?? null;
});

export const getDocumentById = async ({ docId }: { docId: string }) => {
  const ownerId = await getUserId();
  return getDocumentByIdCached(ownerId, docId);
};

const getDocumentByIdCached = cache(async (ownerId: string, docId: string) => {
  "use cache";
  cacheTag(documentTags.allByUser(ownerId));
  cacheTag(documentTags.detailByUserAndDoc(ownerId, docId));

  const [document] = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .limit(1);

  return document ?? null;
});
