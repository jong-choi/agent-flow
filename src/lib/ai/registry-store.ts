import { asc, desc, eq, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import {
  type AiModel,
  aiModelExecutions,
  aiModels,
} from "@/db/schema/ai-models";
import { getModelLimits, initialCreditPolicy } from "./registry";
import { resolveThinkingLevel } from "./thinking";

// These reads intentionally stay fresh: operator CLI updates must be reflected on reload/execution.
export const listModelRegistry = () =>
  db
    .select()
    .from(aiModels)
    .orderBy(asc(aiModels.order), desc(aiModels.createdAt));
export async function getModelByReference(
  reference: string,
): Promise<AiModel | null> {
  const rows = await db
    .select()
    .from(aiModels)
    .where(
      or(
        eq(sql`${aiModels.id}::text`, reference),
        eq(aiModels.modelId, reference),
      ),
    );
  return rows.find((row) => row.id === reference) ?? rows[0] ?? null;
}
export interface CatalogModel {
  provider: string;
  upstreamModelId: string;
  displayName: string;
  contextWindow?: number | null;
  metadata: AiModel["catalogMetadata"];
}
export async function upsertCatalogModel(
  input: CatalogModel,
  initialSettings: Pick<
    Partial<ModelSettings>,
    "metadata" | "appMaxOutputTokens"
  > & { requireFreeAccess?: boolean } = {},
  writer: Pick<typeof db, "insert"> = db,
) {
  const id = randomUUID();
  const [model] = await writer
    .insert(aiModels)
    .values({
      id,
      modelId: `registry:${id}`,
      upstreamModelId: input.upstreamModelId,
      provider: input.provider,
      name: input.displayName,
      contextWindow: input.contextWindow ?? null,
      catalogMetadata: input.metadata,
      catalogCheckedAt: new Date(),
      price:
        initialCreditPolicy[`${input.provider}/${input.upstreamModelId}`] ??
        (input.provider === "ollama" ? 3 : null),
      ...initialSettings,
      isActive: false,
      lifecycle: "candidate",
    })
    .onConflictDoUpdate({
      target: [aiModels.provider, aiModels.upstreamModelId],
      set: {
        contextWindow:
          input.contextWindow === undefined
            ? sql`${aiModels.contextWindow}`
            : input.contextWindow,
        catalogMetadata: sql`${aiModels.catalogMetadata} || ${JSON.stringify(input.metadata)}::jsonb`,
        catalogCheckedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();
  return model;
}
export type ModelSettings = Pick<
  AiModel,
  | "name"
  | "description"
  | "price"
  | "order"
  | "isActive"
  | "appMaxInputTokens"
  | "appMaxOutputTokens"
  | "metadata"
>;
export async function updateModelSettings(
  id: string,
  settings: Partial<ModelSettings>,
) {
  const existing = await getModelByReference(id);
  if (!existing) throw new Error("Model not found");
  if (settings.metadata)
    resolveThinkingLevel({
      ...existing,
      metadata: { ...existing.metadata, ...settings.metadata },
    });
  const [model] = await db
    .update(aiModels)
    .set({
      ...settings,
      ...(settings.isActive !== undefined
        ? { promotionBlocked: !settings.isActive }
        : {}),
      ...(settings.metadata
        ? {
            metadata: sql`coalesce(${aiModels.metadata}, '{}'::jsonb) || ${JSON.stringify(settings.metadata)}::jsonb`,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(aiModels.id, id))
    .returning();
  if (!model) throw new Error("Model not found");
  return model;
}
export async function startModelExecution(
  model: AiModel,
  context: { userId?: string; threadId?: string; nodeId?: string } = {},
) {
  if (model.price === null) throw new Error("Model price is not configured");
  const limits = getModelLimits(model);
  const [execution] = await db
    .insert(aiModelExecutions)
    .values({
      modelRegistryId: model.id,
      provider: model.provider,
      upstreamModelId: model.upstreamModelId,
      credits: model.price,
      inputLimit: limits.input,
      outputLimit: limits.output,
      ...context,
    })
    .returning();
  return execution;
}
export async function finishModelExecution(
  id: string,
  status: "succeeded" | "failed",
) {
  await db
    .update(aiModelExecutions)
    .set({ status, completedAt: new Date() })
    .where(eq(aiModelExecutions.id, id));
}
