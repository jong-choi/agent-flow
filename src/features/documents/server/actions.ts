"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { documents } from "@/db/schema/documents";
import { getUserId } from "@/features/auth/server/queries";
import { documentTags } from "@/features/documents/server/cache/tags";
import {
  getDocumentTitleById,
  getRecentDocumentsForPickerPage,
  getRecentDocumentsForPicker,
  searchDocumentsByTitle,
} from "@/features/documents/server/queries";

const untitledPrefix = "untitled-";

const revalidateDocumentTags = (ownerId: string, docId?: string) => {
  revalidateTag(documentTags.allByUser(ownerId), "max");
  revalidateTag(documentTags.listByUser(ownerId), "max");
  revalidateTag(documentTags.pickerByUser(ownerId), "max");

  if (docId) {
    revalidateTag(documentTags.detailByUserAndDoc(ownerId, docId), "max");
  }
};

const updateDocumentTags = (ownerId: string, docId?: string) => {
  updateTag(documentTags.allByUser(ownerId));
  updateTag(documentTags.listByUser(ownerId));
  updateTag(documentTags.pickerByUser(ownerId));

  if (docId) {
    updateTag(documentTags.detailByUserAndDoc(ownerId, docId));
  }
};

const parseUntitledIndex = (title: string) => {
  const match = title.match(/^untitled-(\d+)$/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
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

  if (document) {
    revalidateDocumentTags(ownerId, docId);
  }

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

  if (document) {
    revalidateDocumentTags(ownerId, docId);
  }

  return document?.content ?? null;
};

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

  if (document) {
    updateDocumentTags(ownerId, document.id);
  }

  return document ?? null;
};

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

  if (document) {
    updateDocumentTags(ownerId, docId);
  }

  return document ?? null;
};

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

  if (document) {
    updateDocumentTags(ownerId, docId);
  }

  return document ?? null;
};

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

export const searchDocumentsByTitleAction = async ({
  query,
  limit = 6,
}: {
  query: string;
  limit?: number;
}) => {
  return searchDocumentsByTitle(query, limit);
};

export const getRecentDocumentsForPickerAction = async ({
  limit = 6,
}: {
  limit?: number;
}) => {
  return getRecentDocumentsForPicker(limit);
};

export const getRecentDocumentsForPickerPageAction = async ({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
}) => {
  return getRecentDocumentsForPickerPage({ cursor, limit });
};

export const getDocumentTitleByIdAction = async ({
  docId,
}: {
  docId: string;
}) => {
  return getDocumentTitleById({ docId });
};
