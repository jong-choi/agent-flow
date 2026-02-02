"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
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
import { normalizeOptionalText } from "@/app/[locale]/(app)/presets/_utils/form-utils";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { users } from "@/db/schema/auth";
import { creditAccounts, creditTransactions } from "@/db/schema/credit";
import { presetPurchases, presetTags, presets } from "@/db/schema/presets";
import { workflows } from "@/db/schema/workflows";

const PRESET_TAGS_MAP = {
  presetById: (presetId: string) => `preset:detail:${presetId}`,
  presetListByUserId: (userId: string) => `preset:list:${userId}`,
} as const;

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
  sort?: "latest" | "purchase" | "name";
};

type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

const resolvePagination = (options?: PaginationOptions) => {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = options?.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
};

const getPresetTagsMap = async (presetIds: string[]) => {
  if (presetIds.length === 0) {
    return new Map<string, string[]>();
  }

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

  return tagsByPresetId;
};

const attachPresetTags = async <T extends { id: string }>(
  presetsList: T[],
): Promise<Array<T & { tags: string[] }>> => {
  if (presetsList.length === 0) {
    return [];
  }

  const tagsByPresetId = await getPresetTagsMap(
    presetsList.map((preset) => preset.id),
  );

  return presetsList.map((preset) => ({
    ...preset,
    tags: tagsByPresetId.get(preset.id) ?? [],
  }));
};

/**
 * 프리셋 마켓(/presets) 리스트 조회.
 * - 표시 데이터: 카드 목록(제목/요약/카테고리/가격/제작자/구매수),
 *   로그인 사용자는 isPurchased로 CTA 상태 표시.
 * - 기능: 검색/카테고리/가격 필터, 정렬, 페이지네이션.
 * - 사용처: src/app/presets/page.tsx
 */
export const getPresets = async (
  filters?: PresetListFilters,
  pagination?: PaginationOptions,
) => {
  const userId = await getUserId({ throwOnError: false });
  const purchaseCount = buildPurchaseCount();
  const isPurchased = buildIsPurchased(userId || undefined);
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

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);

  const sort = filters?.sort ?? "latest";
  const orderBy =
    sort === "popular" || sort === "rating"
      ? [desc(purchaseCount), desc(presets.updatedAt)]
      : sort === "price-asc"
        ? [asc(presets.price), desc(presets.updatedAt)]
        : [desc(presets.updatedAt)];

  const { pageSize, offset } = resolvePagination(pagination);

  const [presetsList, [countRow]] = await Promise.all([
    db
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
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(presets)
      .where(whereClause),
  ]);

  return {
    presets: presetsList,
    totalCount: countRow?.count ?? 0,
  };
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

  return {
    preset,
  };
};

/**
 * 프리셋 상세(/presets/[id]) 화면용 데이터 조회.
 * - 표시 데이터: 프리셋 메타 + 워크플로우(노드/엣지) 미리보기.
 * - 캐시: 30일 revalidate (상세 페이지 렌더 성능 최적화).
 * - 사용처: src/app/presets/[id]/page.tsx
 */
const getPresetDetailCached = (presetId: string) =>
  unstable_cache(
    () => getPresetDetailBase(presetId),
    [PRESET_TAGS_MAP.presetById(presetId)],
    {
      tags: [PRESET_TAGS_MAP.presetById(presetId)],
      revalidate: 60 * 60 * 24 * 30,
    },
  )();

export const getPresetDetail = async (presetId: string) => {
  const base = await getPresetDetailCached(presetId);
  if (!base) {
    return null;
  }

  const workflowData = await getWorkflowWithGraph(base.preset.workflowId);

  return {
    preset: base.preset,
    workflow: workflowData?.workflow ?? null,
    nodes: workflowData?.nodes ?? [],
    edges: workflowData?.edges ?? [],
  };
};

/**
 * 프리셋 상세(/presets/[id])에서 구매 여부 확인.
 * - 표시/동작: 구매/열기 CTA 라벨 결정에 사용.
 * - 사용처: src/app/presets/[id]/page.tsx
 */
export const getPresetPurchaseStatus = async (presetId: string) => {
  const buyerId = await getUserId({ throwOnError: false });
  if (!buyerId) {
    return false;
  }

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

export type PresetPurchaseStatus =
  | "success"
  | "already_purchased"
  | "insufficient_credit"
  | "owned"
  | "not_available";

export type PresetPurchaseResult = {
  status: PresetPurchaseStatus;
  price: number;
};

export const purchasePresetAction = async (
  presetId: string,
): Promise<PresetPurchaseResult> => {
  "use server";

  const buyerId = await getUserId();
  let priceSnapshot = 0;

  try {
    const result = await db.transaction(async (tx) => {
      const [preset] = await tx
        .select({
          id: presets.id,
          ownerId: presets.ownerId,
          title: presets.title,
          price: presets.price,
          isPublished: presets.isPublished,
        })
        .from(presets)
        .where(eq(presets.id, presetId))
        .limit(1);

      if (!preset || !preset.isPublished) {
        return { status: "not_available", price: 0 };
      }

      const price = Math.max(0, preset.price);
      priceSnapshot = price;

      if (preset.ownerId === buyerId) {
        return { status: "owned", price };
      }

      await tx
        .insert(creditAccounts)
        .values({ userId: buyerId })
        .onConflictDoNothing();

      const [purchase] = await tx
        .insert(presetPurchases)
        .values({
          presetId,
          buyerId,
          price,
          purchasedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ presetId: presetPurchases.presetId });

      if (!purchase) {
        return { status: "already_purchased", price };
      }

      if (price > 0) {
        const [account] = await tx
          .update(creditAccounts)
          .set({
            balance: sql`${creditAccounts.balance} - ${price}`,
            totalSpent: sql`${creditAccounts.totalSpent} + ${price}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(creditAccounts.userId, buyerId),
              gte(creditAccounts.balance, price),
            ),
          )
          .returning({ balance: creditAccounts.balance });

        if (!account) {
          throw new Error("INSUFFICIENT_CREDIT");
        }

        await tx.insert(creditTransactions).values({
          userId: buyerId,
          type: "spend",
          category: "preset_purchase",
          title: "프리셋 구매",
          description: preset.title,
          amount: -price,
          occurredAt: new Date(),
        });

        await tx
          .insert(creditAccounts)
          .values({ userId: preset.ownerId })
          .onConflictDoNothing();

        await tx.insert(creditTransactions).values({
          userId: preset.ownerId,
          type: "earn",
          category: "preset_sale",
          title: "프리셋 판매",
          description: preset.title,
          amount: price,
          occurredAt: new Date(),
        });

        await tx
          .update(creditAccounts)
          .set({
            balance: sql`${creditAccounts.balance} + ${price}`,
            totalEarned: sql`${creditAccounts.totalEarned} + ${price}`,
            updatedAt: new Date(),
          })
          .where(eq(creditAccounts.userId, preset.ownerId));
      }

      return { status: "success", price };
    });

    if (result.status === "success" || result.status === "already_purchased") {
      revalidateTag(PRESET_TAGS_MAP.presetListByUserId(buyerId), "default");
      revalidateTag(PRESET_TAGS_MAP.presetById(presetId), "default");
    }

    return result as PresetPurchaseResult;
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDIT") {
      return { status: "insufficient_credit", price: priceSnapshot };
    }

    console.error("프리셋 구매 실패:", error);
    throw error;
  }
};

/**
 * 내 프리셋(/presets/purchased) 요약 통계 조회.
 * - 표시 데이터: 구매한 총 개수/무료 개수(통계 카드).
 * - 사용처: src/app/presets/purchased/page.tsx
 */
export const getPurchasedPresetsSummary = async () => {
  const buyerId = await getUserId();

  const baseWhere = and(
    eq(presetPurchases.buyerId, buyerId),
    ne(presets.ownerId, buyerId),
  );

  const [row] = await db
    .select({
      totalCount: sql<number>`count(*)`.mapWith(Number),
      freeCount: sql<number>`
        sum(case when ${presets.price} = 0 then 1 else 0 end)
      `.mapWith(Number),
    })
    .from(presetPurchases)
    .innerJoin(presets, eq(presets.id, presetPurchases.presetId))
    .where(baseWhere);

  return {
    totalCount: row?.totalCount ?? 0,
    freeCount: row?.freeCount ?? 0,
  };
};

type PurchasedPresetFilters = PresetLibraryFilters & PaginationOptions;

/**
 * 내 프리셋(/presets/purchased) - 구매한 프리셋 목록 조회.
 * - 표시 데이터: 리스트 카드(제목/요약/가격/구매일/태그).
 * - 기능: 검색/카테고리/정렬/페이지네이션.
 * - 사용처: src/app/presets/purchased/page.tsx
 */
const getPurchasedPresetsBase = async ({
  filters,
  buyerId,
}: {
  filters?: PurchasedPresetFilters;
  buyerId: string;
}) => {
  const trimmedQuery = filters?.query?.trim();
  const searchPattern = trimmedQuery ? `%${trimmedQuery}%` : null;

  const clauses = [
    eq(presetPurchases.buyerId, buyerId),
    ne(presets.ownerId, buyerId),
  ];

  if (filters?.category) {
    clauses.push(eq(presets.category, filters.category));
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
      clauses.push(searchClause);
    }
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);
  const sort = filters?.sort ?? "latest";
  const orderBy =
    sort === "name"
      ? [asc(presets.title), desc(presetPurchases.purchasedAt)]
      : sort === "purchase"
        ? [desc(presetPurchases.purchasedAt)]
        : [desc(presets.updatedAt), desc(presetPurchases.purchasedAt)];
  const { pageSize, offset } = resolvePagination(filters);

  const [purchasedPresets, [countRow]] = await Promise.all([
    db
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
        updatedAt: presets.updatedAt,
        purchasedAt: presetPurchases.purchasedAt,
      })
      .from(presetPurchases)
      .innerJoin(presets, eq(presets.id, presetPurchases.presetId))
      .leftJoin(users, eq(users.id, presets.ownerId))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(presetPurchases)
      .innerJoin(presets, eq(presets.id, presetPurchases.presetId))
      .where(whereClause),
  ]);

  const presetsWithTags = await attachPresetTags(purchasedPresets);

  return {
    presets: presetsWithTags,
    totalCount: countRow?.count ?? 0,
  };
};

export const getPurchasedPresets = async (filters?: PurchasedPresetFilters) => {
  const buyerId = await getUserId();

  const getPurchasedPresetsCached = unstable_cache(
    () => getPurchasedPresetsBase({ filters, buyerId }),
    [PRESET_TAGS_MAP.presetListByUserId(buyerId)],
    {
      revalidate: 60 * 60 * 24 * 7,
      tags: [PRESET_TAGS_MAP.presetListByUserId(buyerId)],
    },
  );

  return getPurchasedPresetsCached();
};

/**
 * 내 프리셋(/presets/purchased) - 내가 만든 프리셋 목록 조회.
 * - 표시/통계: 생성한 프리셋 수, 무료 프리셋 수 계산에 사용.
 * - 사용처: src/app/presets/purchased/page.tsx
 */
const getOwnedPresetsBase = async (ownerId: string) => {
  const ownedPresets = await db
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

  return attachPresetTags(ownedPresets);
};

export const getOwnedPresets = async () => {
  const ownerId = await getUserId();

  const getOwnedPresetsCached = unstable_cache(
    () => getOwnedPresetsBase(ownerId),
    [PRESET_TAGS_MAP.presetListByUserId(ownerId)],
    {
      revalidate: 60 * 60 * 24 * 7,
      tags: [PRESET_TAGS_MAP.presetListByUserId(ownerId)],
    },
  );

  return getOwnedPresetsCached();
};

/**
 * 프리셋 생성.
 * - 사용처: src/app/presets/new/[workflowId]/page.tsx
 * - 동작: 워크플로우 소유자 검증 후 프리셋 생성 + 태그 저장.
 */
export const createPreset = async ({
  workflowId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
  tags = [],
}: {
  workflowId: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
  tags?: string[];
}) => {
  const ownerId = await getUserId();
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

  if (preset && tags.length > 0) {
    const normalizedTags = Array.from(
      new Map(
        tags
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .map((tag) => [tag.toLowerCase(), tag]),
      ).values(),
    );

    if (normalizedTags.length > 0) {
      await db
        .insert(presetTags)
        .values(
          normalizedTags.map((tag) => ({
            presetId: preset.id,
            tag,
          })),
        )
        .onConflictDoNothing();
    }
  }

  revalidateTag(PRESET_TAGS_MAP.presetListByUserId(ownerId), "default");
  return preset ?? null;
};

/**
 * 프리셋 수정.
 * - 사용처: src/app/presets/[id]/edit/page.tsx
 * - 동작: 소유자 검증 후 메타 정보 업데이트.
 */
export const updatePreset = async ({
  presetId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
}: {
  presetId: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
}) => {
  const ownerId = await getUserId();
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

  revalidateTag(PRESET_TAGS_MAP.presetListByUserId(ownerId), "default");
  revalidateTag(PRESET_TAGS_MAP.presetById(presetId), "default");
  return preset ?? null;
};

/**
 * 프리셋 삭제.
 * - 사용처: src/app/presets/[id]/edit/page.tsx
 * - 동작: 소유자 검증 후 프리셋 삭제.
 */
export const deletePreset = async ({ presetId }: { presetId: string }) => {
  const ownerId = await getUserId();
  const [preset] = await db
    .delete(presets)
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .returning({ id: presets.id });

  revalidateTag(PRESET_TAGS_MAP.presetListByUserId(ownerId), "default");
  revalidateTag(PRESET_TAGS_MAP.presetById(presetId), "default");
  return preset ?? null;
};

export const getOwnedPresetForEdit = async (presetId: string) => {
  const ownerId = await getUserId({ throwOnError: false });
  if (!ownerId) {
    return null;
  }
  const [preset] = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      workflowTitle: workflows.title,
      workflowUpdatedAt: workflows.updatedAt,
      title: presets.title,
      summary: presets.summary,
      description: presets.description,
      category: presets.category,
      price: presets.price,
      isPublished: presets.isPublished,
    })
    .from(presets)
    .innerJoin(workflows, eq(workflows.id, presets.workflowId))
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .limit(1);

  return preset ?? null;
};

export const createPresetAction = async (formData: FormData) => {
  "use server";

  const titleValue = formData.get("title");

  if (typeof titleValue !== "string" || titleValue.trim() === "") {
    return;
  }
  const workflowId = normalizeOptionalText(formData.get("workflowId"));
  if (!workflowId) {
    throw new Error("workflowId가 전달되지 않았습니다.");
  }

  const description = normalizeOptionalText(formData.get("description"));
  const summary = normalizeOptionalText(formData.get("summary"));
  const category = normalizeOptionalText(formData.get("category"));
  const priceValue = formData.get("price");
  const isPublished = formData.get("isPublished") === "on";
  const tagValues = formData.getAll("tags");
  const tags = Array.from(
    new Map(
      tagValues
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value !== "")
        .map((value) => [value.toLowerCase(), value]),
    ).values(),
  );

  let price = 0;
  if (typeof priceValue === "string" && priceValue.trim() !== "") {
    const parsed = Number(priceValue);
    price = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  const preset = await createPreset({
    workflowId: workflowId,
    title: titleValue.trim(),
    description,
    summary,
    category,
    price,
    isPublished,
    tags,
  });

  if (!preset) {
    throw new Error("프리셋을 생성하는데 실패했습니다.");
  }

  redirect(`/presets/${preset.id}`);
};

export const updatePresetAction = async (formData: FormData) => {
  const titleValue = formData.get("title");

  if (typeof titleValue !== "string" || titleValue.trim() === "") {
    throw new Error("preset title이 없습니다.");
  }

  const presetId = normalizeOptionalText(formData.get("presetId"));

  if (!presetId) {
    throw new Error("presetId가 전달되지 않았습니다.");
  }
  const description = normalizeOptionalText(formData.get("description"));
  const summary = normalizeOptionalText(formData.get("summary"));
  const category = normalizeOptionalText(formData.get("category"));
  const priceValue = formData.get("price");
  const isPublished = formData.get("isPublished") === "on";

  let price = 0;
  if (typeof priceValue === "string" && priceValue.trim() !== "") {
    const parsed = Number(priceValue);
    price = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  const updated = await updatePreset({
    presetId,
    title: titleValue.trim(),
    description,
    summary,
    category,
    price,
    isPublished,
  });

  if (!updated) {
    throw new Error("프리셋 업데이트에 실패하였습니다.");
  }

  redirect(`/presets/${presetId}`);
};

export const deletePresetAction = async (formData: FormData) => {
  const presetId = normalizeOptionalText(formData.get("presetId"));
  if (!presetId) {
    throw new Error("presetId가 전달되지 않았습니다.");
  }

  const deleted = await deletePreset({ presetId });

  if (!deleted) {
    throw new Error("프리셋 삭제에 실패하였습니다.");
  }

  redirect("/presets");
};
