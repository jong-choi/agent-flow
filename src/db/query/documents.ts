"use server";

import { redirect } from "next/navigation";
import { and, asc, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { documents } from "@/db/schema/documents";

const untitledPrefix = "untitled-";

const parseUntitledIndex = (title: string) => {
  const match = title.match(/^untitled-(\d+)$/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

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

/**
 * 사용자 문서 목록 조회.
 * - 표시 데이터: id/title/content/createdAt/updatedAt
 * - 정렬: recent(updatedAt), latest(createdAt), oldest(createdAt), name(title)
 * - 페이지네이션: page * pageSize 만큼 누적 로드
 * - 사용처: src/app/docs/page.tsx
 */
export const getDocumentsByOwner = async (
  filters?: DocumentListFilters,
  pagination?: PaginationOptions,
) => {
  const ownerId = await getUserId();
  const clauses = [eq(documents.ownerId, ownerId), isNull(documents.deletedAt)];

  const trimmedQuery = filters?.query?.trim();
  if (trimmedQuery) {
    clauses.push(ilike(documents.title, `%${trimmedQuery}%`));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);
  const sort = filters?.sort ?? "recent";
  const orderBy =
    sort === "name"
      ? [asc(documents.title)]
      : sort === "latest"
        ? [desc(documents.createdAt)]
        : sort === "oldest"
          ? [asc(documents.createdAt)]
          : [desc(documents.updatedAt)];

  const { offset, pageSize } = resolvePagination(pagination);

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

type DocumentSearchResult = {
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

/**
 * 문서 상세 조회.
 * - 사용처: src/app/docs/[docId]/page.tsx, src/app/docs/edit/[docId]/page.tsx
 * - 동작: 소유자 검증 후 단건 반환
 */
export const getDocumentById = async ({ docId }: { docId: string }) => {
  const ownerId = await getUserId();
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

export const replaceDocumentContentById = async ({
  docId,
  content,
}: {
  docId: string;
  content: string;
}) => {
  const ownerId = await getUserId();
  const [document] = await db
    .update(documents)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .returning({ content: documents.content });

  return document?.content ?? null;
};

export const mergeDocumentContentById = async ({
  docId,
  content,
}: {
  docId: string;
  content: string;
}) => {
  const ownerId = await getUserId();
  const [document] = await db
    .update(documents)
    .set({
      content: sql`${documents.content} || ${content}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .returning({ content: documents.content });

  return document?.content ?? null;
};

/**
 * 새 문서 생성.
 * - 제목: owner 기준 "untitled-숫자" 유니크
 * - 내용: 빈 문자열
 * - 사용처: src/app/docs/page.tsx
 */
export const createUntitledDocument = async () => {
  const ownerId = await getUserId();
  const rows = await db
    .select({ title: documents.title })
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, ownerId),
        ilike(documents.title, "untitled-%"),
        isNull(documents.deletedAt),
      ),
    );

  const maxIndex = rows.reduce((max, row) => {
    const index = parseUntitledIndex(row.title);
    return index && index > max ? index : max;
  }, 0);

  const title = `${untitledPrefix}${maxIndex + 1}`;

  const [document] = await db
    .insert(documents)
    .values({ ownerId, title, content: "" })
    .returning({ id: documents.id });

  return document ?? null;
};

/**
 * 문서 수정.
 * - 사용처: src/app/docs/edit/[docId]/page.tsx
 * - 동작: 제목/내용 업데이트 및 updatedAt 갱신
 */
export const updateDocument = async ({
  docId,
  title,
  content,
}: {
  docId: string;
  title: string;
  content: string;
}) => {
  const ownerId = await getUserId();
  const [document] = await db
    .update(documents)
    .set({
      title,
      content,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .returning({ id: documents.id });

  return document ?? null;
};

/**
 * 문서 삭제 (soft delete).
 * - 사용처: src/app/docs/[docId]/page.tsx
 * - 동작: deletedAt 갱신으로 목록/상세에서 숨김 처리
 */
export const deleteDocument = async ({ docId }: { docId: string }) => {
  const ownerId = await getUserId();
  const [document] = await db
    .update(documents)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(documents.id, docId),
        eq(documents.ownerId, ownerId),
        isNull(documents.deletedAt),
      ),
    )
    .returning({ id: documents.id });

  return document ?? null;
};

/**
 * 문서 삭제 서버 액션 (soft delete).
 * - 사용처: src/app/docs/[docId]/page.tsx
 * - 동작: 로그인 사용자 확인 후 삭제 처리, 완료 시 /docs로 이동
 */
export const deleteDocumentAction = async (formData: FormData) => {
  const docIdValue = formData.get("docId");
  if (typeof docIdValue !== "string" || docIdValue.trim() === "") {
    return;
  }

  const deleted = await deleteDocument({
    docId: docIdValue,
  });

  if (!deleted) {
    return;
  }

  redirect("/docs");
};

export const createDocumentAction = async () => {
  "use server";

  const created = await createUntitledDocument();
  return created?.id ?? null;
};

export const updateDocumentAction = async ({
  docId,
  title,
  content = "",
}: {
  docId: string;
  title: string;
  content?: string;
}) => {
  "use server";

  const updated = await updateDocument({
    docId,
    title,
    content,
  });

  if (!updated) {
    throw new Error("업데이트에 실패하였습니다.");
  }

  redirect(`/docs/${docId}`);
};
