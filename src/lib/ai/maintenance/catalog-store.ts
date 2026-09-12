import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  catalogRuns,
  maintenanceEvents,
  modelHealth,
  providerHealth,
} from "@/db/schema/ai-maintenance";
import { aiModels } from "@/db/schema/ai-models";
import { upsertCatalogModel } from "../registry-store";
import { automaticModelProfile } from "./automatic-access";
import type { CatalogSnapshot } from "./collectors";
import {
  catalogGuard,
  hasRetirementEvidence,
  observePresence,
  readHealth,
} from "./policy";
import { credentialVersion } from "./state-store";

export async function planCatalog(
  snapshot: CatalogSnapshot,
  reader: Pick<typeof db, "select"> = db,
) {
  const [last] = await reader
    .select()
    .from(catalogRuns)
    .where(
      and(
        eq(catalogRuns.provider, snapshot.provider),
        eq(catalogRuns.accepted, 1),
      ),
    )
    .orderBy(desc(catalogRuns.createdAt))
    .limit(1);
  const current = await reader
    .select()
    .from(aiModels)
    .where(eq(aiModels.provider, snapshot.provider));
  const reason = catalogGuard(
    last?.modelIds.length ?? 0,
    snapshot.modelIds.length,
  );
  return {
    accepted: !reason,
    reason,
    added: snapshot.models
      .filter(
        (m) => !current.some((c) => c.upstreamModelId === m.upstreamModelId),
      )
      .map((m) => m.upstreamModelId),
    missing: current
      .filter((m) => !snapshot.modelIds.includes(m.upstreamModelId))
      .map((m) => m.upstreamModelId),
    count: snapshot.modelIds.length,
  };
}
export async function applyCatalog(
  snapshot: CatalogSnapshot,
  discover: boolean,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
    const plan = await planCatalog(snapshot, tx);
    await tx.insert(catalogRuns).values({
      provider: snapshot.provider,
      accepted: plan.accepted ? 1 : 0,
      reason: plan.reason,
      modelIds: snapshot.modelIds,
      createdAt: new Date(snapshot.fetchedAt),
    });
    if (!plan.accepted) {
      await tx.insert(maintenanceEvents).values({
        kind: "catalog_rejected",
        provider: snapshot.provider,
        details: { reason: plan.reason, count: plan.count },
      });
      return plan;
    }
    const current = await tx
      .select()
      .from(aiModels)
      .where(eq(aiModels.provider, snapshot.provider));
    for (const model of snapshot.models) {
      const existing = current.find(
        (m) => m.upstreamModelId === model.upstreamModelId,
      );
      const profile = automaticModelProfile(
        model.provider,
        model.upstreamModelId,
      );
      if (existing || discover)
        await upsertCatalogModel(
          { ...model, displayName: profile?.name ?? model.displayName },
          {
            appMaxOutputTokens: profile?.provider === "groq" ? 512 : 4096,
            ...(profile
              ? {
                  metadata: {
                    thinkingLevel: profile.thinkingLevel,
                    ...("titlePriority" in profile
                      ? { titlePriority: profile.titlePriority }
                      : {}),
                  },
                }
              : {}),
            ...(!existing &&
            (snapshot.provider === "ollama" || profile?.provider === "groq")
              ? { requireFreeAccess: true }
              : {}),
          },
          tx,
        );
    }
    const [provider] = await tx
      .select()
      .from(providerHealth)
      .where(eq(providerHealth.provider, snapshot.provider));
    const healthy =
      !provider ||
      provider.credentialVersion !== credentialVersion(snapshot.provider) ||
      provider.state.status === "healthy";
    for (const model of current) {
      if (model.lifecycle === "retired") continue;
      const [old] = await tx
        .select()
        .from(modelHealth)
        .where(eq(modelHealth.modelId, model.id));
      const state = healthy
        ? observePresence(
            readHealth(old?.state),
            snapshot.modelIds.includes(model.upstreamModelId),
            snapshot.fetchedAt,
          )
        : readHealth(old?.state);
      await tx
        .insert(modelHealth)
        .values({ modelId: model.id, state })
        .onConflictDoUpdate({
          target: modelHealth.modelId,
          set: { state, updatedAt: new Date(snapshot.fetchedAt) },
        });
      if (
        hasRetirementEvidence(
          state,
          snapshot.fetchedAt,
          healthy &&
            Boolean(
              provider?.state.lastSuccessAt &&
                provider.credentialVersion ===
                  credentialVersion(snapshot.provider) &&
                snapshot.fetchedAt - provider.state.lastSuccessAt <
                  24 * 60 * 60 * 1000,
            ),
        )
      ) {
        await tx
          .update(aiModels)
          .set({
            lifecycle: "retired",
            health: "suspended",
            retirementReason: "Confirmed missing from provider catalog",
            updatedAt: new Date(snapshot.fetchedAt),
          })
          .where(eq(aiModels.id, model.id));
        await tx
          .update(modelHealth)
          .set({
            state: {
              ...state,
              status: "suspended",
              reason: "retired",
              nextProbeAt: null,
            },
          })
          .where(eq(modelHealth.modelId, model.id));
        await tx.insert(maintenanceEvents).values({
          kind: "model_retired",
          provider: model.provider,
          modelId: model.id,
          details: { reason: "catalog_and_model_not_found" },
        });
      }
    }
    if (plan.added.length || plan.missing.length)
      await tx.insert(maintenanceEvents).values({
        kind: "catalog_changed",
        provider: snapshot.provider,
        details: {
          added: plan.added,
          missing: plan.missing,
          freeAccessReviewRequired:
            snapshot.provider === "ollama" && plan.added.length > 0,
        },
      });
    return plan;
  });
}
