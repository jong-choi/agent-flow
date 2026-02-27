"use server";

import { cacheTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  type CursorOptions,
  buildCursorOrderBy,
  buildCursorWhere,
  toCursorTimestamp,
} from "@/db/query/cursor";
import { users } from "@/db/schema/auth";
import { chats } from "@/db/schema/chat";
import { creditAccounts, creditTransactions } from "@/db/schema/credit";
import {
  presetPurchases,
  presetTags,
  presets,
  workflowPresets,
} from "@/db/schema/presets";
import { workflows } from "@/db/schema/workflows";
import { getUserId } from "@/features/auth/server/queries";
import { getSidebarNodesWithOptions } from "@/features/canvas/server/queries";
import { buildFlowGraphFromWorkflow } from "@/features/canvas/utils/workflow-graph";
import {
  getChatById,
  getChatsByWorkflowId,
  getPublicChatMessagesByChatId,
} from "@/features/chats/server/queries";
import { updateCreditTagsByUserIds } from "@/features/credits/server/actions";
import { presetTags as presetCacheTags } from "@/features/presets/server/cache/tags";
import { getWorkflowWithGraph } from "@/features/workflows/server/queries";
import { type Locale, routing } from "@/lib/i18n/routing";
import { SHORT_TEXT_MAX_LENGTH_WITH_IME_BUFFER } from "@/lib/utils";

const workflowReferencedPresetPricing = db
  .select({
    workflowId: workflowPresets.workflowId,
    referencedPresetPrice: sql<number>`coalesce(sum(${presets.price}), 0)`
      .mapWith(Number)
      .as("referencedPresetPrice"),
  })
  .from(workflowPresets)
  .innerJoin(presets, eq(presets.id, workflowPresets.presetId))
  .groupBy(workflowPresets.workflowId)
  .as("workflow_referenced_preset_pricing");

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
  ownership?: "all" | "purchased" | "owned";
};

type PresetSortMode = "popular" | "price-asc" | "latest";
type PresetSortFieldKey = "purchaseCount" | "totalPrice" | "updatedAt" | "id";
type PurchasedPresetSortMode = "latest" | "purchase" | "name";
type PurchasedPresetSortFieldKey = "title" | "updatedAt" | "purchasedAt" | "id";

const PRESET_SORT_SCHEMA: Record<
  PresetSortMode,
  Array<{ key: PresetSortFieldKey; direction: "asc" | "desc" }>
> = {
  popular: [
    { key: "purchaseCount", direction: "desc" },
    { key: "updatedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ],
  "price-asc": [
    { key: "totalPrice", direction: "asc" },
    { key: "updatedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ],
  latest: [
    { key: "updatedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ],
};

const PURCHASED_PRESET_SORT_SCHEMA: Record<
  PurchasedPresetSortMode,
  Array<{ key: PurchasedPresetSortFieldKey; direction: "asc" | "desc" }>
> = {
  latest: [
    { key: "updatedAt", direction: "desc" },
    { key: "purchasedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ],
  purchase: [
    { key: "purchasedAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ],
  name: [
    { key: "title", direction: "asc" },
    { key: "purchasedAt", direction: "desc" },
    { key: "id", direction: "asc" },
  ],
};

const getUniqueNormalizedValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const clampPresetSummary = (summary: string | null) =>
  summary ? summary.slice(0, SHORT_TEXT_MAX_LENGTH_WITH_IME_BUFFER) : null;

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const getUniquePresetIds = (presetIds: string[]) =>
  getUniqueNormalizedValues(presetIds);

const getUniqueUserIds = (userIds: string[]) =>
  getUniqueNormalizedValues(userIds);

const getUniqueWorkflowIds = (workflowIds: string[]) =>
  getUniqueNormalizedValues(workflowIds);

type PresetTagTargets = {
  market?: boolean;
  presetIds?: string[];
  ownedUserIds?: string[];
  purchasedUserIds?: string[];
  canvasLibraryUserIds?: string[];
  workflowIds?: string[];
};

const updatePresetTags = ({
  market,
  presetIds,
  ownedUserIds,
  purchasedUserIds,
  canvasLibraryUserIds,
  workflowIds,
}: PresetTagTargets) => {
  if (market) {
    updateTag(presetCacheTags.market());
  }
  if (presetIds?.length) {
    getUniquePresetIds(presetIds).forEach((presetId) => {
      updateTag(presetCacheTags.detailByPreset(presetId));
    });
  }
  if (ownedUserIds?.length) {
    getUniqueUserIds(ownedUserIds).forEach((userId) => {
      updateTag(presetCacheTags.ownedByUser(userId));
    });
  }
  if (purchasedUserIds?.length) {
    getUniqueUserIds(purchasedUserIds).forEach((userId) => {
      updateTag(presetCacheTags.purchasedByUser(userId));
    });
  }
  if (canvasLibraryUserIds?.length) {
    getUniqueUserIds(canvasLibraryUserIds).forEach((userId) => {
      updateTag(presetCacheTags.canvasLibraryByUser(userId));
    });
  }
  if (workflowIds?.length) {
    getUniqueWorkflowIds(workflowIds).forEach((workflowId) => {
      updateTag(presetCacheTags.pricingByWorkflow(workflowId));
    });
  }
};

const getBuyerIdsByPresetIds = async (presetIds: string[]) => {
  const normalizedPresetIds = getUniquePresetIds(presetIds);
  if (normalizedPresetIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ buyerId: presetPurchases.buyerId })
    .from(presetPurchases)
    .where(inArray(presetPurchases.presetId, normalizedPresetIds));

  return getUniqueUserIds(rows.map((row) => row.buyerId));
};

const getReferencingWorkflowIdsByPresetIds = async (presetIds: string[]) => {
  const normalizedPresetIds = getUniquePresetIds(presetIds);
  if (normalizedPresetIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ workflowId: workflowPresets.workflowId })
    .from(workflowPresets)
    .where(inArray(workflowPresets.presetId, normalizedPresetIds));

  return getUniqueWorkflowIds(rows.map((row) => row.workflowId));
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
  cursorOptions?: CursorOptions,
) => {
  const viewerId = await getUserId({ throwOnError: false });
  const cursor = cursorOptions?.cursor?.trim() ?? "";
  const dir = cursorOptions?.dir === "prev" ? "prev" : "next";
  const limitValue =
    typeof cursorOptions?.limit === "number" ? cursorOptions.limit : 12;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getPresetsCached({
    viewerId: viewerId ?? null,
    query: filters?.query?.trim() ?? "",
    category: filters?.category ?? null,
    priceMin: filters?.priceMin ?? null,
    priceMax: filters?.priceMax ?? null,
    sort:
      filters?.sort === "popular" ||
      filters?.sort === "latest" ||
      filters?.sort === "rating" ||
      filters?.sort === "price-asc"
        ? filters.sort
        : "latest",
    cursor,
    dir,
    limit,
  });
};

const getPresetsCached = async ({
  viewerId,
  query,
  category,
  priceMin,
  priceMax,
  sort,
  cursor,
  dir,
  limit,
}: {
  viewerId: string | null;
  query: string;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  sort: "popular" | "latest" | "rating" | "price-asc";
  cursor: string;
  dir: "next" | "prev";
  limit: number;
}) => {
  "use cache";
  cacheTag(presetCacheTags.market());

  const purchaseCount = buildPurchaseCount();
  const isPurchased = buildIsPurchased(viewerId ?? undefined);
  const referencedPresetPrice =
    sql<number>`coalesce(${workflowReferencedPresetPricing.referencedPresetPrice}, 0)`.mapWith(
      Number,
    );
  const totalPrice =
    sql<number>`${presets.price} + ${referencedPresetPrice}`.mapWith(Number);
  const isOwner = viewerId
    ? sql<boolean>`${presets.ownerId} = ${viewerId}`.mapWith(Boolean)
    : sql<boolean>`false`.mapWith(Boolean);
  const clauses = [eq(presets.isPublished, true)];

  if (category) {
    clauses.push(eq(presets.category, category));
  }

  if (query) {
    const pattern = `%${query}%`;
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

  if (priceMin != null) {
    clauses.push(gte(totalPrice, priceMin));
  }

  if (priceMax != null) {
    clauses.push(lte(totalPrice, priceMax));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);
  const sortMode: PresetSortMode =
    sort === "popular" || sort === "rating"
      ? "popular"
      : sort === "price-asc"
        ? "price-asc"
        : "latest";

  let cursorAnchor: {
    id: string;
    updatedAt: string;
    purchaseCount: number;
    totalPrice: number;
  } | null = null;

  if (cursor) {
    const [row] = await db
      .select({
        id: presets.id,
        updatedAt: toCursorTimestamp(presets.updatedAt),
        purchaseCount,
        totalPrice,
      })
      .from(presets)
      .leftJoin(
        workflowReferencedPresetPricing,
        eq(workflowReferencedPresetPricing.workflowId, presets.workflowId),
      )
      .where(and(whereClause, eq(presets.id, cursor)))
      .limit(1);

    cursorAnchor = row ?? null;
  }

  const appliedDir = cursorAnchor && dir === "prev" ? "prev" : "next";
  const fieldValues = {
    purchaseCount,
    totalPrice,
    updatedAt: presets.updatedAt,
    id: presets.id,
  };

  const sortFields = PRESET_SORT_SCHEMA[sortMode].map((field) => ({
    ...field,
    value: fieldValues[field.key],
  }));

  const orderBy = buildCursorOrderBy(
    sortFields.map(({ value, direction }) => ({ value, direction })),
    appliedDir,
  );

  let listWhere = whereClause;
  if (cursorAnchor) {
    const whereFields = sortFields.map(({ key, value, direction }) => ({
      value,
      direction,
      cursor: cursorAnchor[key],
    }));

    const cursorWhere = buildCursorWhere(whereFields, appliedDir);
    if (cursorWhere) {
      listWhere = and(whereClause, cursorWhere);
    }
  }

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: presets.id,
        workflowId: presets.workflowId,
        ownerId: presets.ownerId,
        ownerDisplayName: users.displayName,
        ownerAvatarHash: users.avatarHash,
        isOwner,
        title: presets.title,
        description: presets.description,
        summary: presets.summary,
        category: presets.category,
        price: presets.price,
        referencedPresetPrice,
        totalPrice,
        createdAt: presets.createdAt,
        updatedAt: presets.updatedAt,
        purchaseCount,
        isPurchased,
      })
      .from(presets)
      .leftJoin(users, eq(users.id, presets.ownerId))
      .leftJoin(
        workflowReferencedPresetPricing,
        eq(workflowReferencedPresetPricing.workflowId, presets.workflowId),
      )
      .where(listWhere)
      .orderBy(...orderBy)
      .limit(limit + 1),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(presets)
      .leftJoin(
        workflowReferencedPresetPricing,
        eq(workflowReferencedPresetPricing.workflowId, presets.workflowId),
      )
      .where(whereClause),
  ]);

  const hasMore = rows.length > limit;
  const sliced = rows.slice(0, limit);
  const presetsList = appliedDir === "prev" ? sliced.reverse() : sliced;

  const hasPrev = appliedDir === "next" ? Boolean(cursorAnchor) : hasMore;
  const hasNext = appliedDir === "next" ? hasMore : Boolean(cursorAnchor);

  const firstId = presetsList[0]?.id ?? cursorAnchor?.id ?? null;
  const lastId =
    presetsList[presetsList.length - 1]?.id ?? cursorAnchor?.id ?? null;

  return {
    presets: presetsList,
    totalCount: countRow?.count ?? 0,
    pageInfo: {
      hasPrev,
      hasNext,
      prevCursor: hasPrev ? firstId : null,
      nextCursor: hasNext ? lastId : null,
    },
  };
};

const getPresetDetailBase = async (presetId: string) => {
  const purchaseCount = buildPurchaseCount();

  const [preset] = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      chatId: presets.chatId,
      ownerId: presets.ownerId,
      ownerDisplayName: users.displayName,
      ownerAvatarHash: users.avatarHash,
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
const getPresetDetailCached = async (presetId: string) => {
  "use cache";
  cacheTag(presetCacheTags.detailByPreset(presetId));

  return getPresetDetailBase(presetId);
};

export const getWorkflowReferencedPresetPricingSummary = async ({
  workflowId,
  excludePresetId,
}: {
  workflowId: string;
  excludePresetId?: string;
}) => {
  const normalizedWorkflowId = workflowId.trim();
  if (!normalizedWorkflowId) {
    return {
      referencedPresetPrice: 0,
      referencedPresetCount: 0,
    };
  }

  const normalizedExcludePresetId = excludePresetId?.trim() || undefined;

  return getWorkflowReferencedPresetPricingSummaryCached({
    workflowId: normalizedWorkflowId,
    excludePresetId: normalizedExcludePresetId,
  });
};

const getWorkflowReferencedPresetPricingSummaryCached = async ({
  workflowId,
  excludePresetId,
}: {
  workflowId: string;
  excludePresetId?: string;
}) => {
  "use cache";
  cacheTag(presetCacheTags.pricingByWorkflow(workflowId));

  const clauses = [eq(workflowPresets.workflowId, workflowId)];

  if (excludePresetId) {
    clauses.push(ne(workflowPresets.presetId, excludePresetId));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);

  const [row] = await db
    .select({
      referencedPresetPrice: sql<number>`
        coalesce(sum(${presets.price}), 0)
      `.mapWith(Number),
      referencedPresetCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(workflowPresets)
    .innerJoin(presets, eq(presets.id, workflowPresets.presetId))
    .where(whereClause);

  return {
    referencedPresetPrice: Math.max(0, row?.referencedPresetPrice ?? 0),
    referencedPresetCount: row?.referencedPresetCount ?? 0,
  };
};

const getWorkflowReferencedPresets = async (workflowId: string) => {
  const rows = await db
    .select({
      id: presets.id,
      title: presets.title,
      price: presets.price,
      ownerId: presets.ownerId,
      ownerDisplayName: users.displayName,
      ownerAvatarHash: users.avatarHash,
      updatedAt: presets.updatedAt,
    })
    .from(workflowPresets)
    .innerJoin(presets, eq(presets.id, workflowPresets.presetId))
    .leftJoin(users, eq(users.id, presets.ownerId))
    .where(eq(workflowPresets.workflowId, workflowId))
    .orderBy(desc(presets.price), desc(presets.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    price: Math.max(0, row.price),
    ownerId: row.ownerId,
    ownerDisplayName: row.ownerDisplayName ?? null,
    ownerAvatarHash: row.ownerAvatarHash ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }));
};

export const getPresetDetail = async (presetId: string) => {
  const base = await getPresetDetailCached(presetId);
  if (!base) {
    return null;
  }

  const workflowId = base.preset.workflowId;

  const [workflowData, referencedPresetsList] = await Promise.all([
    getWorkflowWithGraph(workflowId),
    getWorkflowReferencedPresets(workflowId),
  ]);

  const referencedPresetPrice = referencedPresetsList.reduce(
    (sum, preset) => sum + preset.price,
    0,
  );
  const currentPresetPrice = Math.max(0, base.preset.price);
  const totalPrice = currentPresetPrice + referencedPresetPrice;

  return {
    preset: {
      ...base.preset,
      referencedPresetPrice,
      totalPrice,
    },
    workflow: workflowData?.workflow ?? null,
    nodes: workflowData?.nodes ?? [],
    edges: workflowData?.edges ?? [],
    referencedPresets: referencedPresetsList,
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
  totalPrice: number;
  currentPresetPrice: number;
  referencedPresetPrice: number;
};

export const purchasePresetAction = async (
  presetId: string,
): Promise<PresetPurchaseResult> => {
  const buyerId = await getUserId();
  let priceSnapshot: Pick<
    PresetPurchaseResult,
    "totalPrice" | "currentPresetPrice" | "referencedPresetPrice"
  > = {
    totalPrice: 0,
    currentPresetPrice: 0,
    referencedPresetPrice: 0,
  };
  let referencedPresetIdsSnapshot: string[] = [];
  let creditAffectedUserIdsSnapshot: string[] = [];

  try {
    const result = await db.transaction(async (tx) => {
      const [preset] = await tx
        .select({
          id: presets.id,
          ownerId: presets.ownerId,
          title: presets.title,
          price: presets.price,
          isPublished: presets.isPublished,
          workflowId: presets.workflowId,
        })
        .from(presets)
        .where(eq(presets.id, presetId))
        .limit(1);

      if (!preset || !preset.isPublished) {
        return {
          status: "not_available",
          totalPrice: 0,
          currentPresetPrice: 0,
          referencedPresetPrice: 0,
        };
      }

      const currentPresetPrice = Math.max(0, preset.price);

      if (preset.ownerId === buyerId) {
        return {
          status: "owned",
          totalPrice: currentPresetPrice,
          currentPresetPrice,
          referencedPresetPrice: 0,
        };
      }

      const referencedPresetsList = await tx
        .select({
          id: presets.id,
          ownerId: presets.ownerId,
          title: presets.title,
          price: presets.price,
        })
        .from(workflowPresets)
        .innerJoin(presets, eq(presets.id, workflowPresets.presetId))
        .where(
          and(
            eq(workflowPresets.workflowId, preset.workflowId),
            ne(workflowPresets.presetId, preset.id),
          ),
        );

      referencedPresetIdsSnapshot = referencedPresetsList.map((row) => row.id);
      creditAffectedUserIdsSnapshot = [
        buyerId,
        preset.ownerId,
        ...referencedPresetsList.map((row) => row.ownerId),
      ];

      const referencedPresetPrice = referencedPresetsList.reduce(
        (sum, row) => sum + Math.max(0, row.price),
        0,
      );

      const totalPrice = currentPresetPrice + referencedPresetPrice;

      priceSnapshot = { totalPrice, currentPresetPrice, referencedPresetPrice };

      await tx
        .insert(creditAccounts)
        .values({ userId: buyerId })
        .onConflictDoNothing();

      const purchasedAt = new Date();

      const [purchase] = await tx
        .insert(presetPurchases)
        .values({
          presetId,
          buyerId,
          price: currentPresetPrice,
          purchasedAt,
        })
        .onConflictDoNothing()
        .returning({ presetId: presetPurchases.presetId });

      if (!purchase) {
        return { status: "already_purchased", ...priceSnapshot };
      }

      const referencedPurchaseValues = referencedPresetsList
        .filter((row) => row.ownerId !== buyerId)
        .map((row) => ({
          presetId: row.id,
          buyerId,
          price: Math.max(0, row.price),
          purchasedAt,
        }));

      if (referencedPurchaseValues.length > 0) {
        await tx
          .insert(presetPurchases)
          .values(referencedPurchaseValues)
          .onConflictDoNothing();
      }

      if (totalPrice > 0) {
        const [account] = await tx
          .update(creditAccounts)
          .set({
            balance: sql`${creditAccounts.balance} - ${totalPrice}`,
            totalSpent: sql`${creditAccounts.totalSpent} + ${totalPrice}`,
            updatedAt: purchasedAt,
          })
          .where(
            and(
              eq(creditAccounts.userId, buyerId),
              gte(creditAccounts.balance, totalPrice),
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
          amount: -totalPrice,
          occurredAt: purchasedAt,
        });

        const payouts = new Map<string, number>();

        const addPayout = (userId: string, amount: number) => {
          if (amount <= 0) return;
          payouts.set(userId, (payouts.get(userId) ?? 0) + amount);
        };

        addPayout(preset.ownerId, currentPresetPrice);
        referencedPresetsList.forEach((row) =>
          addPayout(row.ownerId, Math.max(0, row.price)),
        );

        const payoutEntries = Array.from(payouts.entries()).filter(
          ([, amount]) => amount > 0,
        );

        if (payoutEntries.length > 0) {
          await tx
            .insert(creditAccounts)
            .values(payoutEntries.map(([userId]) => ({ userId })))
            .onConflictDoNothing();

          await tx.insert(creditTransactions).values(
            payoutEntries.map(([userId, amount]) => ({
              userId,
              type: "earn" as const,
              category: "preset_sale" as const,
              title: "프리셋 판매",
              description: preset.title,
              amount,
              occurredAt: purchasedAt,
            })),
          );

          for (const [userId, amount] of payoutEntries) {
            await tx
              .update(creditAccounts)
              .set({
                balance: sql`${creditAccounts.balance} + ${amount}`,
                totalEarned: sql`${creditAccounts.totalEarned} + ${amount}`,
                updatedAt: purchasedAt,
              })
              .where(eq(creditAccounts.userId, userId));
          }
        }
      }

      return { status: "success", ...priceSnapshot };
    });

    if (result.status === "success" || result.status === "already_purchased") {
      const affectedPresetIds = [presetId, ...referencedPresetIdsSnapshot];
      const tagTargets: PresetTagTargets = {
        market: true,
        purchasedUserIds: [buyerId],
        canvasLibraryUserIds: [buyerId],
        presetIds: affectedPresetIds,
      };
      updatePresetTags(tagTargets);
    }

    if (result.status === "success" && result.totalPrice > 0) {
      void updateCreditTagsByUserIds(creditAffectedUserIdsSnapshot);
    }

    return result as PresetPurchaseResult;
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDIT") {
      return { status: "insufficient_credit", ...priceSnapshot };
    }

    console.error("프리셋 구매 실패:", error);
    throw error;
  }
};

const getPresetLibraryForCanvasBase = async ({
  userId,
  query,
  cursor,
  limit,
}: {
  userId: string;
  query: string;
  cursor: string;
  limit: number;
}) => {
  const ownershipClause = or(
    eq(presets.ownerId, userId),
    isNotNull(presetPurchases.presetId),
  );
  if (!ownershipClause) {
    return {
      items: [],
      pageInfo: {
        hasNext: false,
        nextCursor: null,
      },
    };
  }

  const searchClause = query ? ilike(presets.title, `%${query}%`) : undefined;
  const baseWhere = searchClause
    ? and(ownershipClause, searchClause)
    : ownershipClause;

  let cursorAnchor: { id: string; updatedAt: string } | null = null;
  if (cursor) {
    const [row] = await db
      .select({
        id: presets.id,
        updatedAt: toCursorTimestamp(presets.updatedAt),
      })
      .from(presets)
      .leftJoin(
        presetPurchases,
        and(
          eq(presetPurchases.presetId, presets.id),
          eq(presetPurchases.buyerId, userId),
        ),
      )
      .where(and(baseWhere, eq(presets.id, cursor)))
      .limit(1);

    cursorAnchor = row ?? null;
  }

  const orderBy = buildCursorOrderBy(
    [
      { value: presets.updatedAt, direction: "desc" },
      { value: presets.id, direction: "desc" },
    ],
    "next",
  );

  let listWhere = baseWhere;
  if (cursorAnchor) {
    const cursorWhere = buildCursorWhere(
      [
        {
          value: presets.updatedAt,
          cursor: cursorAnchor.updatedAt,
          direction: "desc",
        },
        {
          value: presets.id,
          cursor: cursorAnchor.id,
          direction: "desc",
        },
      ],
      "next",
    );

    if (cursorWhere) {
      listWhere = and(baseWhere, cursorWhere);
    }
  }

  const rows = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      title: presets.title,
      summary: presets.summary,
      category: presets.category,
      ownerId: presets.ownerId,
      ownerDisplayName: users.displayName,
      ownerAvatarHash: users.avatarHash,
      purchasedAt: presetPurchases.purchasedAt,
      updatedAt: presets.updatedAt,
    })
    .from(presets)
    .leftJoin(users, eq(users.id, presets.ownerId))
    .leftJoin(
      presetPurchases,
      and(
        eq(presetPurchases.presetId, presets.id),
        eq(presetPurchases.buyerId, userId),
      ),
    )
    .where(listWhere)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const sliced = rows.slice(0, limit);
  const items = sliced.map((row) => ({
    id: row.id,
    workflowId: row.workflowId,
    title: row.title,
    summary: row.summary ?? null,
    category: row.category ?? null,
    ownerId: row.ownerId,
    ownerDisplayName: row.ownerDisplayName ?? null,
    ownerAvatarHash: row.ownerAvatarHash ?? null,
    purchasedAt: row.purchasedAt ? row.purchasedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  }));

  const nextCursor = hasNext ? (items[items.length - 1]?.id ?? null) : null;

  return {
    items,
    pageInfo: {
      hasNext,
      nextCursor,
    },
  };
};

export const getPresetLibraryForCanvasAction = async (
  options?: CursorOptions & { query?: string },
) => {
  const userId = await getUserId();
  const cursor = options?.cursor?.trim() ?? "";
  const query = options?.query?.trim() ?? "";
  const limitValue = typeof options?.limit === "number" ? options.limit : 20;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getPresetLibraryForCanvasCached({ userId, query, cursor, limit });
};

const getPresetLibraryForCanvasCached = async ({
  userId,
  query,
  cursor,
  limit,
}: {
  userId: string;
  query: string;
  cursor: string;
  limit: number;
}) => {
  "use cache";
  cacheTag(presetCacheTags.canvasLibraryByUser(userId));

  return getPresetLibraryForCanvasBase({ userId, query, cursor, limit });
};

export const getPresetGraphForCanvasAction = async (
  presetId: string,
  locale: Locale = routing.defaultLocale,
) => {
  const userId = await getUserId();

  const [preset] = await db
    .select({
      id: presets.id,
      workflowId: presets.workflowId,
      title: presets.title,
      ownerId: presets.ownerId,
      purchasedPresetId: presetPurchases.presetId,
    })
    .from(presets)
    .leftJoin(
      presetPurchases,
      and(
        eq(presetPurchases.presetId, presets.id),
        eq(presetPurchases.buyerId, userId),
      ),
    )
    .where(eq(presets.id, presetId))
    .limit(1);

  if (!preset) {
    throw new Error("프리셋을 찾을 수 없습니다.");
  }

  const hasAccess =
    preset.ownerId === userId || Boolean(preset.purchasedPresetId);

  if (!hasAccess) {
    throw new Error("해당 프리셋을 불러올 권한이 없습니다.");
  }

  const workflowData = await getWorkflowWithGraph(preset.workflowId);
  if (!workflowData) {
    throw new Error("프리셋 워크플로우 데이터를 불러오지 못했습니다.");
  }

  const sidebarNodes = await getSidebarNodesWithOptions(locale);
  const { nodes, edges } = buildFlowGraphFromWorkflow({
    workflowNodes: workflowData.nodes,
    workflowEdges: workflowData.edges,
    sidebarNodes,
  });

  const excludedNodeIds = new Set(
    nodes
      .filter((node) => node.type === "startNode" || node.type === "endNode")
      .map((node) => node.id),
  );

  const filteredNodes = nodes.filter((node) => !excludedNodeIds.has(node.id));
  const filteredEdges = edges.filter(
    (edge) =>
      !excludedNodeIds.has(edge.source) && !excludedNodeIds.has(edge.target),
  );

  return {
    preset: {
      id: preset.id,
      title: preset.title,
      workflowId: preset.workflowId,
    },
    nodes: filteredNodes.map((node) => {
      if (node.type !== "documentNode") {
        return node;
      }

      const content = node.data.content;
      if (!content) {
        return node;
      }

      return {
        ...node,
        data: {
          ...node.data,
          content: {
            ...content,
            referenceId: null,
          },
        },
      };
    }),
    edges: filteredEdges,
  };
};

type PurchasedPresetFilters = PresetLibraryFilters;

/**
 * 내 프리셋(/presets/purchased) - 구매한 프리셋 목록 조회.
 * - 표시 데이터: 리스트 카드(제목/요약/가격/구매일/태그).
 * - 기능: 검색/카테고리/정렬/페이지네이션.
 * - 사용처: src/app/presets/purchased/page.tsx
 */
const getPurchasedPresetsBase = async ({
  filters,
  buyerId,
  cursor,
  dir,
  limit,
}: {
  filters?: PurchasedPresetFilters;
  buyerId: string;
  cursor: string;
  dir: "next" | "prev";
  limit: number;
}) => {
  const trimmedQuery = filters?.query?.trim();
  const searchPattern = trimmedQuery ? `%${trimmedQuery}%` : null;

  const referencedPresetPrice =
    sql<number>`coalesce(${workflowReferencedPresetPricing.referencedPresetPrice}, 0)`.mapWith(
      Number,
    );
  const totalPrice =
    sql<number>`${presets.price} + ${referencedPresetPrice}`.mapWith(Number);
  const libraryPurchasedAt =
    sql<Date>`coalesce(${presetPurchases.purchasedAt}, ${presets.createdAt})`.mapWith(
      Date,
    );
  const ownership: "all" | "purchased" | "owned" =
    filters?.ownership === "purchased" || filters?.ownership === "owned"
      ? filters.ownership
      : "all";
  const ownershipClause =
    ownership === "owned"
      ? eq(presets.ownerId, buyerId)
      : ownership === "purchased"
        ? sql<boolean>`${presetPurchases.buyerId} is not null`
        : sql<boolean>`(${presets.ownerId} = ${buyerId} or ${presetPurchases.buyerId} is not null)`;

  const clauses = [ownershipClause];

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
  const sortMode: PurchasedPresetSortMode =
    filters?.sort === "purchase" || filters?.sort === "name"
      ? filters.sort
      : "latest";

  let cursorAnchor: {
    id: string;
    title: string;
    updatedAt: string;
    purchasedAt: string;
  } | null = null;

  if (cursor) {
    const [row] = await db
      .select({
        id: presets.id,
        title: presets.title,
        updatedAt: toCursorTimestamp(presets.updatedAt),
        purchasedAt: toCursorTimestamp(libraryPurchasedAt),
      })
      .from(presets)
      .leftJoin(
        presetPurchases,
        and(
          eq(presetPurchases.presetId, presets.id),
          eq(presetPurchases.buyerId, buyerId),
        ),
      )
      .where(and(whereClause, eq(presets.id, cursor)))
      .limit(1);

    cursorAnchor = row ?? null;
  }

  const appliedDir = cursorAnchor && dir === "prev" ? "prev" : "next";
  const fieldValues = {
    title: presets.title,
    updatedAt: presets.updatedAt,
    purchasedAt: libraryPurchasedAt,
    id: presets.id,
  };

  const sortFields = PURCHASED_PRESET_SORT_SCHEMA[sortMode].map((field) => ({
    ...field,
    value: fieldValues[field.key],
  }));

  const orderBy = buildCursorOrderBy(
    sortFields.map(({ value, direction }) => ({ value, direction })),
    appliedDir,
  );

  let listWhere = whereClause;
  if (cursorAnchor) {
    const whereFields = sortFields.map(({ key, value, direction }) => ({
      value,
      direction,
      cursor: cursorAnchor[key],
    }));

    const cursorWhere = buildCursorWhere(whereFields, appliedDir);
    if (cursorWhere) {
      listWhere = and(whereClause, cursorWhere);
    }
  }

  const [rows, [countRow]] = await Promise.all([
    db
      .select({
        id: presets.id,
        workflowId: presets.workflowId,
        ownerId: presets.ownerId,
        ownerDisplayName: users.displayName,
        ownerAvatarHash: users.avatarHash,
        title: presets.title,
        description: presets.description,
        summary: presets.summary,
        category: presets.category,
        price: presets.price,
        referencedPresetPrice,
        totalPrice,
        isPublished: presets.isPublished,
        updatedAt: presets.updatedAt,
        purchasedAt: libraryPurchasedAt,
      })
      .from(presets)
      .leftJoin(
        presetPurchases,
        and(
          eq(presetPurchases.presetId, presets.id),
          eq(presetPurchases.buyerId, buyerId),
        ),
      )
      .leftJoin(users, eq(users.id, presets.ownerId))
      .leftJoin(
        workflowReferencedPresetPricing,
        eq(workflowReferencedPresetPricing.workflowId, presets.workflowId),
      )
      .where(listWhere)
      .orderBy(...orderBy)
      .limit(limit + 1),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(presets)
      .leftJoin(
        presetPurchases,
        and(
          eq(presetPurchases.presetId, presets.id),
          eq(presetPurchases.buyerId, buyerId),
        ),
      )
      .where(whereClause),
  ]);

  const hasMore = rows.length > limit;
  const sliced = rows.slice(0, limit);
  const purchasedPresets = appliedDir === "prev" ? sliced.reverse() : sliced;
  const presetsWithTags = await attachPresetTags(purchasedPresets);

  const hasPrev = appliedDir === "next" ? Boolean(cursorAnchor) : hasMore;
  const hasNext = appliedDir === "next" ? hasMore : Boolean(cursorAnchor);
  const firstId = presetsWithTags[0]?.id ?? cursorAnchor?.id ?? null;
  const lastId =
    presetsWithTags[presetsWithTags.length - 1]?.id ?? cursorAnchor?.id ?? null;

  return {
    presets: presetsWithTags,
    totalCount: countRow?.count ?? 0,
    pageInfo: {
      hasPrev,
      hasNext,
      prevCursor: hasPrev ? firstId : null,
      nextCursor: hasNext ? lastId : null,
    },
  };
};

export const getPurchasedPresets = async (
  filters?: PurchasedPresetFilters,
  cursorOptions?: CursorOptions,
) => {
  const buyerId = await getUserId();
  const cursor = cursorOptions?.cursor?.trim() ?? "";
  const dir = cursorOptions?.dir === "prev" ? "prev" : "next";
  const limitValue =
    typeof cursorOptions?.limit === "number" ? cursorOptions.limit : 12;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getPurchasedPresetsCached({ filters, buyerId, cursor, dir, limit });
};

const getPurchasedPresetsCached = async ({
  filters,
  buyerId,
  cursor,
  dir,
  limit,
}: {
  filters?: PurchasedPresetFilters;
  buyerId: string;
  cursor: string;
  dir: "next" | "prev";
  limit: number;
}) => {
  "use cache";
  cacheTag(presetCacheTags.ownedByUser(buyerId));
  cacheTag(presetCacheTags.purchasedByUser(buyerId));

  return getPurchasedPresetsBase({ filters, buyerId, cursor, dir, limit });
};

/**
 * 프리셋 생성.
 * - 사용처: src/app/presets/new/[workflowId]/page.tsx
 * - 동작: 워크플로우 소유자 검증 후 프리셋 생성 + 태그 저장.
 */
export const createPreset = async ({
  workflowId,
  chatId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
  tags = [],
}: {
  workflowId: string;
  chatId?: string | null;
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

  const normalizedSummary = clampPresetSummary(summary);

  let selectedChatId = chatId ?? null;
  if (selectedChatId) {
    const [chat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(
        and(
          eq(chats.id, selectedChatId),
          eq(chats.userId, ownerId),
          eq(chats.workflowId, workflowId),
          isNull(chats.deletedAt),
        ),
      )
      .limit(1);

    if (!chat) {
      selectedChatId = null;
    }
  }

  const [preset] = await db
    .insert(presets)
    .values({
      ownerId,
      workflowId,
      chatId: selectedChatId,
      title,
      description,
      summary: normalizedSummary,
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

  const tagTargets: PresetTagTargets = {
    ownedUserIds: [ownerId],
    canvasLibraryUserIds: [ownerId],
    market: isPublished,
    presetIds: preset ? [preset.id] : [],
  };
  updatePresetTags(tagTargets);

  return preset ?? null;
};

/**
 * 프리셋 수정.
 * - 사용처: src/app/presets/[id]/edit/page.tsx
 * - 동작: 소유자 검증 후 메타 정보 업데이트.
 */
export const updatePreset = async ({
  presetId,
  chatId,
  title,
  description,
  summary,
  category,
  price,
  isPublished,
}: {
  presetId: string;
  chatId: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
}) => {
  const ownerId = await getUserId();
  const [existingPreset] = await db
    .select({ workflowId: presets.workflowId })
    .from(presets)
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .limit(1);

  if (!existingPreset) {
    return null;
  }

  const normalizedSummary = clampPresetSummary(summary);

  const [affectedBuyerIds, affectedWorkflowIds] = await Promise.all([
    getBuyerIdsByPresetIds([presetId]),
    getReferencingWorkflowIdsByPresetIds([presetId]),
  ]);

  let selectedChatId = chatId ?? null;
  if (selectedChatId) {
    const [chat] = await db
      .select({ id: chats.id })
      .from(chats)
      .where(
        and(
          eq(chats.id, selectedChatId),
          eq(chats.userId, ownerId),
          eq(chats.workflowId, existingPreset.workflowId),
          isNull(chats.deletedAt),
        ),
      )
      .limit(1);

    if (!chat) {
      selectedChatId = null;
    }
  }

  const [preset] = await db
    .update(presets)
    .set({
      chatId: selectedChatId,
      title,
      description,
      summary: normalizedSummary,
      category,
      price,
      isPublished,
      updatedAt: new Date(),
    })
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .returning({ id: presets.id });

  if (!preset) {
    return null;
  }

  const tagTargets: PresetTagTargets = {
    ownedUserIds: [ownerId],
    purchasedUserIds: affectedBuyerIds,
    canvasLibraryUserIds: [ownerId, ...affectedBuyerIds],
    market: true,
    presetIds: [presetId],
    workflowIds: affectedWorkflowIds,
  };
  updatePresetTags(tagTargets);

  return preset ?? null;
};

/**
 * 프리셋 삭제.
 * - 사용처: src/app/presets/[id]/edit/page.tsx
 * - 동작: 소유자 검증 후 프리셋 삭제.
 */
export const deletePreset = async ({ presetId }: { presetId: string }) => {
  const ownerId = await getUserId();
  const [affectedBuyerIds, affectedWorkflowIds] = await Promise.all([
    getBuyerIdsByPresetIds([presetId]),
    getReferencingWorkflowIdsByPresetIds([presetId]),
  ]);

  const [preset] = await db
    .delete(presets)
    .where(and(eq(presets.id, presetId), eq(presets.ownerId, ownerId)))
    .returning({ id: presets.id });

  if (!preset) {
    return null;
  }

  const tagTargets: PresetTagTargets = {
    ownedUserIds: [ownerId],
    purchasedUserIds: affectedBuyerIds,
    canvasLibraryUserIds: [ownerId, ...affectedBuyerIds],
    market: true,
    presetIds: [presetId],
    workflowIds: affectedWorkflowIds,
  };
  updatePresetTags(tagTargets);

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
      chatId: presets.chatId,
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

export const getPresetChatExamplesForForm = async ({
  workflowId,
  chatId,
}: {
  workflowId: string;
  chatId?: string | null;
}) => {
  const chats = await getChatsByWorkflowId({ workflowId });

  if (!chatId) {
    return {
      chats,
      pinnedChat: null,
      defaultSelectedId: "",
    };
  }

  const existingChat = chats.find((chat) => chat.id === chatId);
  if (existingChat) {
    return {
      chats,
      pinnedChat: {
        ...existingChat,
        title: existingChat.title ?? "연결된 채팅",
      },
      defaultSelectedId: chatId,
    };
  }

  try {
    const [chat, messages] = await Promise.all([
      getChatById(chatId),
      getPublicChatMessagesByChatId({ chatId }),
    ]);

    return {
      chats,
      pinnedChat: {
        id: chat.id,
        title: chat.title ?? "연결된 채팅",
        messages,
      },
      defaultSelectedId: chatId,
    };
  } catch {
    return {
      chats,
      pinnedChat: null,
      defaultSelectedId: "",
    };
  }
};

export const createPresetAction = async (formData: FormData) => {
  const titleValue = formData.get("title");

  if (typeof titleValue !== "string" || titleValue.trim() === "") {
    return;
  }
  const workflowId = normalizeOptionalText(formData.get("workflowId"));
  if (!workflowId) {
    throw new Error("workflowId가 전달되지 않았습니다.");
  }

  const chatId = normalizeOptionalText(formData.get("chatId"));
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
    chatId,
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
  const chatId = normalizeOptionalText(formData.get("chatId"));
  const priceValue = formData.get("price");
  const isPublished = formData.get("isPublished") === "on";

  let price = 0;
  if (typeof priceValue === "string" && priceValue.trim() !== "") {
    const parsed = Number(priceValue);
    price = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  const updated = await updatePreset({
    presetId,
    chatId,
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
