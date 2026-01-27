import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { createUntitledDocument, getDocumentsByOwner } from "@/db/query/documents";
import { users } from "@/db/schema/auth";
import { DocumentsClient } from "@/app/docs/documents-client";
import { auth } from "@/lib/auth";

type DocsPageSearchParams = {
  q?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

const resolveParam = (value: string | string[] | undefined, fallback: string) =>
  (Array.isArray(value) ? value[0] : value) ?? fallback;

const resolvePage = (value: string | string[] | undefined) => {
  const parsed = Number.parseInt(resolveParam(value, "1"), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const PAGE_SIZE = 10;

const buildQueryString = (
  base: { [key: string]: string },
  overrides: Partial<{ [key: string]: string }>,
) => {
  const params = new URLSearchParams();
  const next = { ...base, ...overrides };

  Object.entries(next).forEach(([key, value]) => {
    if (!value) return;
    if (key === "sort" && value === "recent") return;
    if (key === "page" && value === "1") return;
    if (key === "q" && value.trim() === "") return;
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<DocsPageSearchParams> | DocsPageSearchParams;
}) {
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

  const resolvedSearchParams = await searchParams;
  const query = resolveParam(resolvedSearchParams?.q, "");
  const sort = resolveParam(resolvedSearchParams?.sort, "recent");
  const page = resolvePage(resolvedSearchParams?.page);

  const { documents, totalCount } = await getDocumentsByOwner(
    user.id,
    {
      query,
      sort:
        sort === "latest" || sort === "oldest" || sort === "name"
          ? sort
          : "recent",
    },
    { page, pageSize: PAGE_SIZE },
  );

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
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (page > totalPages) {
    redirect(
      `/docs${buildQueryString(
        { q: query, sort, page: String(page) },
        { page: String(totalPages) },
      )}`,
    );
  }

  return (
    <DocumentsClient
      documents={serializableDocuments}
      createDocument={createDocumentAction}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
