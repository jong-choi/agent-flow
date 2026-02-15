import { revalidateTag } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import "server-only";
import { db } from "@/db/client";
import { documents } from "@/db/schema/documents";
import { getUserId } from "@/features/auth/server/queries";
import { documentTags } from "@/features/documents/server/cache/tags";

const revalidateDocumentTags = (ownerId: string, docId?: string) => {
  revalidateTag(documentTags.allByUser(ownerId), "seconds");
  revalidateTag(documentTags.listByUser(ownerId), "seconds");
  revalidateTag(documentTags.pickerByUser(ownerId), "seconds");

  if (docId) {
    revalidateTag(documentTags.detailByUserAndDoc(ownerId, docId), "seconds");
  }
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
