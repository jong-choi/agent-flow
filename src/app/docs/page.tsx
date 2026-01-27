import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { createUntitledDocument, getDocumentsByOwner } from "@/db/query/documents";
import { users } from "@/db/schema/auth";
import { DocumentsClient } from "@/app/docs/documents-client";
import { auth } from "@/lib/auth";

export default async function DocumentsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const documents = await getDocumentsByOwner(user.id);

  const createDocumentAction = async () => {
    "use server";

    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      notFound();
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      notFound();
    }

    const created = await createUntitledDocument(user.id);
    return created?.id ?? null;
  };

  const serializableDocuments = documents.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return (
    <DocumentsClient
      documents={serializableDocuments}
      createDocument={createDocumentAction}
    />
  );
}
