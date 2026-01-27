import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { DocumentEditClient } from "@/app/docs/document-edit-client";
import { db } from "@/db/client";
import { getDocumentById, updateDocument } from "@/db/query/documents";
import { users } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export default async function DocumentEditPage({
  params,
}: PageProps<"/docs/edit/[docId]">) {
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

  const { docId } = await params;
  const document = await getDocumentById({ docId, ownerId: user.id });

  if (!document) {
    notFound();
  }

  const updateDocumentAction = async (formData: FormData) => {
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

    const titleValue = formData.get("title");
    if (typeof titleValue !== "string" || titleValue.trim() === "") {
      return;
    }

    const contentValue = formData.get("content");
    const content = typeof contentValue === "string" ? contentValue : "";

    const updated = await updateDocument({
      docId,
      ownerId: user.id,
      title: titleValue.trim(),
      content,
    });

    if (!updated) {
      notFound();
    }

    redirect(`/docs/${docId}`);
  };

  return (
    <DocumentEditClient
      document={{
        id: document.id,
        title: document.title,
        content: document.content,
        updatedAt: document.updatedAt.toISOString(),
      }}
      updateAction={updateDocumentAction}
    />
  );
}
