"use server";

import { unstable_cache } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { users } from "@/db/schema/auth";
import { presetPurchases, presets } from "@/db/schema/presets";
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

export const getPresets = async (viewerId?: string) => {
  const purchaseCount = buildPurchaseCount();
  const isPurchased = buildIsPurchased(viewerId);

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
    .where(eq(presets.isPublished, true))
    .orderBy(desc(presets.updatedAt));
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
