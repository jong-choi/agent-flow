import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db/client";
import {
  freeAccessPolicies,
  maintenanceEvents,
  modelChecks,
  modelHealth,
  providerHealth,
} from "@/db/schema/ai-maintenance";
import { type AiModel, aiModels } from "@/db/schema/ai-models";
import { isSelectableModel } from "../registry";
import { getModelByReference } from "../registry-store";
import { hasAutomaticFreeAccess } from "./automatic-access";
import {
  MINUTE,
  type Observation,
  type ProviderFailure,
  initialHealth,
  readHealth,
  transitionModel,
  transitionProvider,
} from "./policy";

export const providerKeys: Record<string, string> = {
  google: "GOOGLE_AI_API_KEY",
  groq: "GROQ_API_KEY",
  ollama: "OLLAMA_API_KEY",
};
export function credentialVersion(provider: string) {
  return createHash("sha256")
    .update(process.env[providerKeys[provider]] ?? "")
    .digest("hex");
}
export async function availabilityMap(models: AiModel[], now = Date.now()) {
  const [states, providers, policies] = await Promise.all([
    db.select().from(modelHealth),
    db.select().from(providerHealth),
    db.select().from(freeAccessPolicies),
  ]);
  return new Map(
    models.map((model) => {
      const state = readHealth(
        states.find((s) => s.modelId === model.id)?.state,
      );
      const p = providers.find(
        (p) =>
          p.provider === model.provider &&
          p.credentialVersion === credentialVersion(model.provider),
      );
      const policy = policies.find(
        (p) =>
          p.provider === model.provider &&
          p.credentialVersion === credentialVersion(model.provider) &&
          p.expiresAt.getTime() > now &&
          p.modelIds.includes(model.upstreamModelId),
      );
      let reason: string | null = !isSelectableModel(model)
        ? model.lifecycle === "retired"
          ? "retired"
          : (state.reason ?? "model_unavailable")
        : null;
      if (
        providerKeys[model.provider] &&
        !process.env[providerKeys[model.provider]]
      )
        reason = "credential_missing";
      if (
        model.retirementAt &&
        model.retirementSourceUrl &&
        model.retirementAt.getTime() <= now
      )
        reason = "retired";
      if (p && p.state.status !== "healthy")
        reason = p.state.reason ?? "provider_unavailable";
      if (
        model.requireFreeAccess &&
        !policy &&
        !hasAutomaticFreeAccess(model, now)
      )
        reason = "free_access_unverified";
      return [
        model.id,
        {
          available: !reason,
          reason,
          nextProbeAt:
            p?.state.status !== "healthy" && p?.state.nextProbeAt
              ? p.state.nextProbeAt
              : state.nextProbeAt,
        },
      ];
    }),
  );
}
export async function assertModelAdmission(id: string, probe = false) {
  const model = await getModelByReference(id);
  if (!model)
    throw Object.assign(new Error("Model no longer exists"), {
      code: "MODEL_UNAVAILABLE",
    });
  if (probe) {
    if (model.lifecycle === "retired")
      throw Object.assign(new Error("Retired models are not probed"), {
        code: "MODEL_UNAVAILABLE",
      });
    return;
  }
  const available = (await availabilityMap([model])).get(id)!;
  if (!available.available)
    throw Object.assign(new Error(`Model unavailable: ${available.reason}`), {
      code: "MODEL_UNAVAILABLE",
    });
}
export async function recordObservation(model: AiModel, event: Observation) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
    const [currentModel] = await tx
      .select()
      .from(aiModels)
      .where(eq(aiModels.id, model.id));
    if (!currentModel) return;
    const [stateRow] = await tx
      .select()
      .from(modelHealth)
      .where(eq(modelHealth.modelId, model.id));
    const [providerRow] = await tx
      .select()
      .from(providerHealth)
      .where(eq(providerHealth.provider, model.provider));
    const version = credentialVersion(model.provider);
    const oldProvider =
      providerRow?.credentialVersion === version
        ? readHealth(providerRow.state)
        : initialHealth();
    const previous = readHealth(stateRow?.state);
    await tx.insert(modelChecks).values({
      modelId: model.id,
      provider: model.provider,
      source: event.source,
      ok: event.ok ? 1 : 0,
      scope: event.error?.scope ?? "model",
      category: event.error?.category,
      code: event.error?.code,
      checkedAt: new Date(event.at),
    });
    const recent = await tx
      .select({ modelId: modelChecks.modelId })
      .from(modelChecks)
      .where(
        and(
          eq(modelChecks.provider, model.provider),
          eq(modelChecks.ok, 0),
          inArray(modelChecks.category, ["upstream", "timeout"]),
          gte(
            modelChecks.checkedAt,
            new Date(
              Math.max(event.at - 10 * MINUTE, oldProvider.lastSuccessAt ?? 0),
            ),
          ),
        ),
      );
    const broad =
      !event.ok &&
      ["upstream", "timeout"].includes(event.error?.category ?? "") &&
      new Set(recent.map((x) => x.modelId)).size >= 3;
    // A fresh successful probe can establish provider recovery before model recovery.
    let nextProvider = transitionProvider(oldProvider, event, broad);
    if (nextProvider.status !== "healthy")
      nextProvider = { ...nextProvider, probeModelId: model.id };
    const blocked = !event.ok && nextProvider.status !== "healthy";
    let next = transitionModel(previous, event, blocked);
    if (blocked)
      next = { ...next, firstFailureAt: null, failedProbes: 0, failures: 0 };
    await tx
      .insert(providerHealth)
      .values({
        provider: model.provider,
        credentialVersion: version,
        state: nextProvider,
      })
      .onConflictDoUpdate({
        target: providerHealth.provider,
        set: {
          credentialVersion: version,
          state: nextProvider,
          updatedAt: new Date(event.at),
        },
      });
    await tx
      .insert(modelHealth)
      .values({ modelId: model.id, state: next })
      .onConflictDoUpdate({
        target: modelHealth.modelId,
        set: { state: next, updatedAt: new Date(event.at) },
      });
    if (currentModel.lifecycle !== "retired")
      await tx
        .update(aiModels)
        .set({
          ...(event.error?.scope === "model" &&
          event.error.category === "permission"
            ? { entitlement: "blocked" as const }
            : event.ok &&
                currentModel.entitlement === "blocked" &&
                !currentModel.requireFreeAccess
              ? { entitlement: "unknown" as const }
              : {}),
          health: next.status === "blocked" ? "suspended" : next.status,
          updatedAt: new Date(event.at),
        })
        .where(eq(aiModels.id, model.id));
    if (blocked && oldProvider.status === "healthy") {
      // Do not let an account-wide outage consume every model's 48-hour clock.
      await tx.execute(
        sql`update ai_model_health h set state=h.state || '{"firstFailureAt":null,"failedProbes":0,"failures":0,"failureWindowAt":null}'::jsonb from ai_models m where h.model_id=m.id and m.provider=${model.provider}`,
      );
    }
    if (
      previous.status !== next.status ||
      oldProvider.status !== nextProvider.status
    )
      await tx.insert(maintenanceEvents).values({
        kind: "health_changed",
        provider: model.provider,
        modelId: model.id,
        details: {
          modelStatus: next.status,
          providerStatus: nextProvider.status,
          reason: next.reason ?? nextProvider.reason,
        },
      });
  });
}

export async function recordProviderFailure(
  provider: string,
  error: ProviderFailure,
  at = Date.now(),
) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
    const [row] = await tx
      .select()
      .from(providerHealth)
      .where(eq(providerHealth.provider, provider));
    const version = credentialVersion(provider);
    const previous =
      row?.credentialVersion === version
        ? readHealth(row.state)
        : initialHealth();
    const state = transitionProvider(previous, {
      ok: false,
      source: "probe",
      at,
      error: { ...error, scope: "provider" },
    });
    await tx
      .insert(providerHealth)
      .values({ provider, credentialVersion: version, state })
      .onConflictDoUpdate({
        target: providerHealth.provider,
        set: { state, credentialVersion: version, updatedAt: new Date(at) },
      });
    if (state.status !== "healthy" && previous.status === "healthy")
      await tx.execute(
        sql`update ai_model_health h set state=h.state || '{"firstFailureAt":null,"failedProbes":0,"failures":0,"failureWindowAt":null}'::jsonb from ai_models m where h.model_id=m.id and m.provider=${provider}`,
      );
  });
}
