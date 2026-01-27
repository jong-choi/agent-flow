"use server";

import { redirect } from "next/navigation";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { documents } from "@/db/schema/documents";
import { users } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

const untitledPrefix = "untitled-";

const parseUntitledIndex = (title: string) => {
  const match = title.match(/^untitled-(\d+)$/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveNextUntitledTitle = async (ownerId: string) => {
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

  return `${untitledPrefix}${maxIndex + 1}`;
};

/**
 * 사용자 문서 목록 조회.
 * - 표시 데이터: id/title/content/createdAt/updatedAt
 * - 정렬: 최근 업데이트 순
 * - 사용처: src/app/docs/page.tsx
 */
export const getDocumentsByOwner = async (ownerId: string) => {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(and(eq(documents.ownerId, ownerId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt));
};

/**
 * 문서 상세 조회.
 * - 사용처: src/app/docs/[docId]/page.tsx, src/app/docs/edit/[docId]/page.tsx
 * - 동작: 소유자 검증 후 단건 반환
 */
export const getDocumentById = async ({
  docId,
  ownerId,
}: {
  docId: string;
  ownerId: string;
}) => {
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

/**
 * 새 문서 생성.
 * - 제목: owner 기준 "untitled-숫자" 유니크
 * - 내용: 빈 문자열
 * - 사용처: src/app/docs/page.tsx
 */
export const createUntitledDocument = async (ownerId: string) => {
  const title = await resolveNextUntitledTitle(ownerId);

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
  ownerId,
  title,
  content,
}: {
  docId: string;
  ownerId: string;
  title: string;
  content: string;
}) => {
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
export const deleteDocument = async ({
  docId,
  ownerId,
}: {
  docId: string;
  ownerId: string;
}) => {
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

  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return;
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return;
  }

  const deleted = await deleteDocument({
    docId: docIdValue,
    ownerId: user.id,
  });

  if (!deleted) {
    return;
  }

  redirect("/docs");
};
