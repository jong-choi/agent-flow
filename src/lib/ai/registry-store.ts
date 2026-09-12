import { asc, desc, eq, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import {
  type AiModel,
  aiModelExecutions,
  aiModels,
} from "@/db/schema/ai-models";
import { getModelLimits, initialCreditPolicy } from "./registry";

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
export async function upsertCatalogModel(input: CatalogModel) {
  const id = randomUUID();
  const [model] = await db
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
>;
export async function updateModelSettings(
  id: string,
  settings: Partial<ModelSettings>,
) {
  const [model] = await db
    .update(aiModels)
    .set({ ...settings, updatedAt: new Date() })
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
