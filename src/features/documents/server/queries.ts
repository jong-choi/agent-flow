import "server-only";

import { and, asc, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { documents } from "@/db/schema/documents";
import { documentTags } from "@/features/documents/server/cache/tags";

type DocumentListFilters = {
  query?: string;
  sort?: "recent" | "latest" | "oldest" | "name";
};

type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

const resolvePagination = (options?: PaginationOptions) => {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
};

export const getDocumentsByOwner = async (
  filters?: DocumentListFilters,
  pagination?: PaginationOptions,
) => {
  const ownerId = await getUserId();
  const { pageSize, offset } = resolvePagination(pagination);
  const query = filters?.query?.trim() ?? "";
  const sort = filters?.sort ?? "recent";

  return getDocumentsByOwnerCached({
    ownerId,
    query,
    sort,
    pageSize,
    offset,
  });
};

const getDocumentsByOwnerCached = async ({
  ownerId,
  query,
  sort,
  pageSize,
  offset,
}: {
  ownerId: string;
  query: string;
  sort: "recent" | "latest" | "oldest" | "name";
  pageSize: number;
  offset: number;
}) => {
  "use cache";
  cacheTag(documentTags.allByUser(ownerId));
  cacheTag(documentTags.listByUser(ownerId));

  const clauses = [eq(documents.ownerId, ownerId), isNull(documents.deletedAt)];

  if (query) {
    clauses.push(ilike(documents.title, `%${query}%`));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);
  const orderBy =
    sort === "name"
      ? [asc(documents.title)]
      : sort === "latest"
        ? [desc(documents.createdAt)]
        : sort === "oldest"
          ? [asc(documents.createdAt)]
          : [desc(documents.updatedAt)];

  const [documentsList, [countRow]] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        totalCount: sql<number>`count(*)`.mapWith(Number),
      })
      .from(documents)
      .where(whereClause),
  ]);

  return {
    documents: documentsList,
    totalCount: countRow?.totalCount ?? 0,
  };
};

export type DocumentSearchResult = {
  id: string;
  title: string;
  content: string;
};

export const searchDocumentsByTitle = async (
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
};

export const getRecentDocumentsForPicker = async (
  limit = 6,
): Promise<DocumentSearchResult[]> => {
  const userId = await getUserId();
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  return getRecentDocumentsForPickerCached(userId, safeLimit);
};

const getRecentDocumentsForPickerCached = async (
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
};

export const getDocumentTitleById = async ({
  docId,
}: {
  docId: string;
}): Promise<string | null> => {
  const ownerId = await getUserId();
  return getDocumentTitleByIdCached(ownerId, docId);
};

const getDocumentTitleByIdCached = async (
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
};

export const getDocumentById = async ({ docId }: { docId: string }) => {
  const ownerId = await getUserId();
  return getDocumentByIdCached(ownerId, docId);
};

const getDocumentByIdCached = async (ownerId: string, docId: string) => {
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
};
