"use server";

import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { users } from "@/db/schema/auth";
import {
  presetFavorites,
  presetPurchases,
  presetTags,
  presets,
} from "@/db/schema/presets";
import { workflows } from "@/db/schema/workflows";

const buildPurchaseCount = () =>
  sql<number>`
    (select count(*)
     from ${presetPurchases}
     where ${presetPurchases.presetId} = ${presets.id})
  `.mapWith(Number);

const buildIsPurchased = (buyerId?: string) =>
  buyerId
    ? sql<boolean>`
        exists(
          select 1
          from ${presetPurchases}
          where ${presetPurchases.presetId} = ${presets.id}
            and ${presetPurchases.buyerId} = ${buyerId}
        )
      `.mapWith(Boolean)
    : sql<boolean>`false`.mapWith(Boolean);

const buildIsFavorite = (userId?: string) =>
  userId
    ? sql<boolean>`
        exists(
          select 1
          from ${presetFavorites}
          where ${presetFavorites.presetId} = ${presets.id}
            and ${presetFavorites.userId} = ${userId}
        )
      `.mapWith(Boolean)
    : sql<boolean>`false`.mapWith(Boolean);

const RECENT_WINDOW_SQL = sql`now() - interval '14 days'`;

type PresetListFilters = {
  query?: string;
  category?: string | null;
  priceMin?: number;
  priceMax?: number;
  sort?: "popular" | "latest" | "rating" | "price-asc";
};

type PresetLibraryFilters = {
  query?: string;
  category?: string | null;
  status?: "all" | "recent" | "favorite";
  sort?: "recent" | "purchase" | "name";
};

export const getPresets = async (
  viewerId?: string,
  filters?: PresetListFilters,
) => {
  const purchaseCount = buildPurchaseCount();
  const isPurchased = buildIsPurchased(viewerId);
  const clauses = [eq(presets.isPublished, true)];

  if (filters?.category) {
    clauses.push(eq(presets.category, filters.category));
  }

  const trimmedQuery = filters?.query?.trim();
  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    const tagSearchClause = sql<boolean>`
      exists(
        select 1
        from ${presetTags}
        where ${presetTags.presetId} = ${presets.id}
          and ${presetTags.tag} ilike ${pattern}
      )
    `;
    const searchClause = or(
      ilike(presets.title, pattern),
      ilike(presets.summary, pattern),
      ilike(presets.description, pattern),
      tagSearchClause,
    );
    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  if (filters?.priceMin != null) {
    clauses.push(gte(presets.price, filters.priceMin));
  }

  if (filters?.priceMax != null) {
    clauses.push(lte(presets.price, filters.priceMax));
  }

  const whereClause =
    clauses.length === 1 ? clauses[0] : and(...clauses);

  const sort = filters?.sort ?? "latest";
  const orderBy =
    sort === "popular" || sort === "rating"
      ? [desc(purchaseCount), desc(presets.updatedAt)]
      : sort === "price-asc"
        ? [asc(presets.price), desc(presets.updatedAt)]
        : [desc(presets.updatedAt)];

  return db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      createdAt: presets.createdAt,
      updatedAt: presets.updatedAt,
      purchaseCount,
      isPurchased,
    })
    .from(presets)
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(whereClause)
    .orderBy(...orderBy);
};

const getPresetDetailBase = async (presetId: string) => {
  const purchaseCount = buildPurchaseCount();

  const [preset] = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      createdAt: presets.createdAt,
      updatedAt: presets.updatedAt,
      purchaseCount,
    })
    .from(presets)
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(eq(presets.id, presetId))
    .limit(1);

  if (!preset) {
    return null;
  }

  const workflowData = await getWorkflowWithGraph(preset.workflowId);

  return {
    preset,
    workflow: workflowData?.workflow ?? null,
    nodes: workflowData?.nodes ?? [],
    edges: workflowData?.edges ?? [],
  };
};

export const getPresetDetail = unstable_cache(
  getPresetDetailBase,
  ["preset_detail"],
  { tags: ["preset_detail"], revalidate: 60 * 60 * 24 * 30 },
);

export const getPresetPurchaseStatus = async (
  presetId: string,
  buyerId: string,
) => {
  const [purchase] = await db
    .select({ presetId: presetPurchases.presetId })
    .from(presetPurchases)
    .where(
      and(
        eq(presetPurchases.presetId, presetId),
        eq(presetPurchases.buyerId, buyerId),
      ),
    )
    .limit(1);

  return Boolean(purchase);
};

export const getPurchasedPresets = async (buyerId: string) => {
  return db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      updatedAt: presets.updatedAt,
      purchasedAt: presetPurchases.purchasedAt,
    })
    .from(presetPurchases)
    .innerJoin(presets, eq(presets.id, presetPurchases.presetId))
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(eq(presetPurchases.buyerId, buyerId))
    .orderBy(desc(presetPurchases.purchasedAt));
};

export const getOwnedPresets = async (ownerId: string) => {
  return db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      isPublished: presets.isPublished,
      createdAt: presets.createdAt,
      updatedAt: presets.updatedAt,
    })
    .from(presets)
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(eq(presets.ownerId, ownerId))
    .orderBy(desc(presets.updatedAt));
};

const createdSource = sql<string>`'created'`.mapWith(String);
const purchasedSource = sql<string>`'purchased'`.mapWith(String);

export const getPresetLibrary = async (
  userId: string,
  filters?: PresetLibraryFilters,
) => {
  const isFavorite = buildIsFavorite(userId);
  const trimmedQuery = filters?.query?.trim();
  const searchPattern = trimmedQuery ? `%${trimmedQuery}%` : null;

  const ownedClauses = [eq(presets.ownerId, userId)];
  const purchasedClauses = [
    eq(presetPurchases.buyerId, userId),
    ne(presets.ownerId, userId),
  ];

  if (filters?.category) {
    ownedClauses.push(eq(presets.category, filters.category));
    purchasedClauses.push(eq(presets.category, filters.category));
  }

  if (searchPattern) {
    const tagSearchClause = sql<boolean>`
      exists(
        select 1
        from ${presetTags}
        where ${presetTags.presetId} = ${presets.id}
          and ${presetTags.tag} ilike ${searchPattern}
      )
    `;
    const searchClause = or(
      ilike(presets.title, searchPattern),
      ilike(presets.summary, searchPattern),
      ilike(presets.description, searchPattern),
      tagSearchClause,
    );
    if (searchClause) {
      ownedClauses.push(searchClause);
      purchasedClauses.push(searchClause);
    }
  }

  if (filters?.status === "recent") {
    ownedClauses.push(gte(presets.updatedAt, RECENT_WINDOW_SQL));
    purchasedClauses.push(gte(presetPurchases.purchasedAt, RECENT_WINDOW_SQL));
  }

  if (filters?.status === "favorite") {
    ownedClauses.push(isFavorite);
    purchasedClauses.push(isFavorite);
  }

  const ownedWhere =
    ownedClauses.length === 1 ? ownedClauses[0] : and(...ownedClauses);
  const purchasedWhere =
    purchasedClauses.length === 1
      ? purchasedClauses[0]
      : and(...purchasedClauses);

  const ownedQuery = db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      isPublished: presets.isPublished,
      displayDate: presets.updatedAt,
      source: createdSource,
      isFavorite,
    })
    .from(presets)
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(ownedWhere);

  const purchasedQuery = db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      ownerId: presets.ownerId,
      ownerName: users.name,
      title: presets.title,
      description: presets.description,
      summary: presets.summary,
      category: presets.category,
      price: presets.price,
      isPublished: presets.isPublished,
      displayDate: presetPurchases.purchasedAt,
      source: purchasedSource,
      isFavorite,
    })
    .from(presetPurchases)
    .innerJoin(presets, eq(presets.id, presetPurchases.presetId))
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(purchasedWhere);

  const [ownedPresets, purchasedPresets] = await Promise.all([
    ownedQuery,
    purchasedQuery,
  ]);

  const libraryPresets = [...ownedPresets, ...purchasedPresets];
  if (libraryPresets.length === 0) {
    return [];
  }

  const presetIds = libraryPresets.map((preset) => preset.id);
  const presetTagRows = await db
    .select({
      presetId: presetTags.presetId,
      tag: presetTags.tag,
    })
    .from(presetTags)
    .where(inArray(presetTags.presetId, presetIds))
    .orderBy(asc(presetTags.tag));

  const tagsByPresetId = new Map<string, string[]>();
  presetTagRows.forEach((row) => {
    const tags = tagsByPresetId.get(row.presetId) ?? [];
    tags.push(row.tag);
    tagsByPresetId.set(row.presetId, tags);
  });

  const libraryWithTags = libraryPresets.map((preset) => ({
    ...preset,
    tags: tagsByPresetId.get(preset.id) ?? [],
  }));
  const sort = filters?.sort ?? "recent";

  if (sort === "name") {
    libraryWithTags.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    const toTimestamp = (value: Date | null) =>
      value ? value.getTime() : 0;
    libraryWithTags.sort(
      (a, b) => toTimestamp(b.displayDate) - toTimestamp(a.displayDate),
    );
  }

  return libraryWithTags;
};

export const addPresetFavorite = async ({
  presetId,
  userId,
}: {
  presetId: string;
  userId: string;
}) => {
  const [favorite] = await db
    .insert(presetFavorites)
    .values({ presetId, userId })
    .onConflictDoNothing()
    .returning({ presetId: presetFavorites.presetId });

  return favorite ?? null;
};

export const removePresetFavorite = async ({
  presetId,
  userId,
}: {
  presetId: string;
  userId: string;
}) => {
  const [favorite] = await db
    .delete(presetFavorites)
    .where(
      and(
        eq(presetFavorites.presetId, presetId),
        eq(presetFavorites.userId, userId),
      ),
    )
    .returning({ presetId: presetFavorites.presetId });

  return favorite ?? null;
};

export const getPresetFavoriteStatus = async (
  presetId: string,
  userId: string,
) => {
  const [favorite] = await db
    .select({ presetId: presetFavorites.presetId })
    .from(presetFavorites)
    .where(
      and(
        eq(presetFavorites.presetId, presetId),
        eq(presetFavorites.userId, userId),
      ),
    )
    .limit(1);

  return Boolean(favorite);
};

export const createPreset = async ({
  ownerId,
  workflowId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
}: {
  ownerId: string;
  workflowId: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
}) => {
  const [workflow] = await db
    .select({ id: workflows.id })
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.ownerId, ownerId)))
    .limit(1);

  if (!workflow) {
    return null;
  }

  const [preset] = await db
    .insert(presets)
    .values({
      ownerId,
      workflowId,
      title,
      description,
      summary,
      category,
      price,
      isPublished,
    })
    .returning({ id: presets.id });

  return preset ?? null;
};

export const updatePreset = async ({
  presetId,
  ownerId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
}: {
  presetId: string;
  ownerId: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
}) => {
  const [preset] = await db
    .update(presets)
    .set({
      title,
      description,
      summary,
      category,
      price,
      isPublished,
      updatedAt: new Date(),
    })
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .returning({ id: presets.id });

  return preset ?? null;
};

export const deletePreset = async ({
  presetId,
  ownerId,
}: {
  presetId: string;
  ownerId: string;
}) => {
  const [preset] = await db
    .delete(presets)
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .returning({ id: presets.id });

  return preset ?? null;
};
