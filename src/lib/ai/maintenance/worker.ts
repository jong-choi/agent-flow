import { and, eq, lte, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import postgres from "postgres";
import { db } from "@/db/client";
import {
  freeAccessPolicies,
  maintenanceEvents,
  maintenanceJobs,
  modelHealth,
  noticeSnapshots,
} from "@/db/schema/ai-maintenance";
import { aiModels } from "@/db/schema/ai-models";
import { normalizeProviderError } from "../error";
import { aiFetch, runAiCall } from "../execution";
import { hasAutomaticFreeAccess } from "./automatic-access";
import { applyCatalog } from "./catalog-store";
import { type Provider, collectCatalog, providers } from "./collectors";
import { HOUR, MINUTE, initialHealth } from "./policy";
import { runDueProbes } from "./probes";
import { credentialVersion, recordProviderFailure } from "./state-store";

export const noticeUrls: Record<Provider, string> = {
  google: "https://ai.google.dev/gemini-api/docs/deprecations",
  groq: "https://console.groq.com/docs/deprecations",
  ollama: "https://docs.ollama.com/cloud",
};
export function nextJobAt(key: string, now: number) {
  if (key === "probes" || key === "retirements")
    return new Date(now + 15 * MINUTE);
  const date = new Date(now);
  date.setUTCHours(
    19,
    key.includes("weekly") || key.startsWith("notice:") ? 17 : 37,
    0,
    0,
  );
  if (date.getTime() <= now) date.setUTCDate(date.getUTCDate() + 1);
  if (key.includes("weekly") || key.startsWith("notice:"))
    while (date.getUTCDay() !== 0) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
export async function initializeJobs(now = Date.now()) {
  const keys = [
    ...providers.flatMap((p) => [
      `catalog:${p}:daily`,
      `catalog:${p}:weekly`,
      `notice:${p}`,
    ]),
    "probes",
    "retirements",
  ];
  for (const key of keys)
    await db
      .insert(maintenanceJobs)
      .values({ key, nextRunAt: new Date(now) })
      .onConflictDoNothing();
}
export async function claimJob(owner: string, now = Date.now()) {
  const rows = await db.execute(
    sql`with candidate as (select key from ai_maintenance_jobs where next_run_at <= ${new Date(now).toISOString()} and (lease_until is null or lease_until < ${new Date(now).toISOString()}) order by next_run_at,key for update skip locked limit 1) update ai_maintenance_jobs j set lease_owner=${owner},lease_until=${new Date(now + 5 * MINUTE).toISOString()} from candidate c where j.key=c.key returning j.key`,
  );
  return rows[0]?.key as string | undefined;
}
async function monitorNotice(provider: Provider, signal: AbortSignal) {
  const html = await runAiCall(
    async (current) => {
      const r = await aiFetch(noticeUrls[provider], { signal: current });
      if (!r.ok) throw Error("Notice fetch failed");
      return r.text();
    },
    { signal, timeoutMs: 30000 },
  );
  // Only detect changes. Ambiguous/untrusted page text never directly retires a model.
  const normalized = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length < 200) throw Error("Notice content incomplete");
  const digest = createHash("sha256").update(normalized).digest("hex");
  const [old] = await db
    .select()
    .from(noticeSnapshots)
    .where(eq(noticeSnapshots.provider, provider));
  if (old && old.digest !== digest)
    await db.insert(maintenanceEvents).values({
      kind: "retirement_notice_changed",
      provider,
      details: { url: noticeUrls[provider] },
    });
  await db
    .insert(noticeSnapshots)
    .values({ provider, digest })
    .onConflictDoUpdate({
      target: noticeSnapshots.provider,
      set: { digest, checkedAt: new Date() },
    });
}
export async function applyScheduledRetirements(now = Date.now()) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
    const rows = await tx
      .select()
      .from(aiModels)
      .where(
        and(
          lte(aiModels.retirementAt, new Date(now)),
          eq(aiModels.lifecycle, "deprecated"),
        ),
      );
    for (const model of rows) {
      if (!model.retirementSourceUrl) continue;
      await tx
        .update(aiModels)
        .set({
          lifecycle: "retired",
          health: "suspended",
          updatedAt: new Date(now),
        })
        .where(eq(aiModels.id, model.id));
      await tx
        .insert(modelHealth)
        .values({
          modelId: model.id,
          state: { ...initialHealth(), status: "suspended", reason: "retired" },
        })
        .onConflictDoUpdate({
          target: modelHealth.modelId,
          set: {
            state: {
              ...initialHealth(),
              status: "suspended",
              reason: "retired",
            },
          },
        });
      await tx.insert(maintenanceEvents).values({
        kind: "model_retired",
        provider: model.provider,
        modelId: model.id,
        details: {
          reason: "reviewed_notice",
          source: model.retirementSourceUrl,
        },
      });
    }
    const managed = await tx
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.requireFreeAccess, true),
          eq(aiModels.entitlement, "free_confirmed"),
        ),
      );
    const policies = await tx.select().from(freeAccessPolicies);
    for (const model of managed) {
      const valid =
        hasAutomaticFreeAccess(model, now) ||
        policies.some(
          (p) =>
            p.provider === model.provider &&
            p.credentialVersion === credentialVersion(model.provider) &&
            p.expiresAt.getTime() > now &&
            p.modelIds.includes(model.upstreamModelId),
        );
      if (!valid) {
        await tx
          .update(aiModels)
          .set({ entitlement: "unknown" })
          .where(eq(aiModels.id, model.id));
        await tx.insert(maintenanceEvents).values({
          kind: "free_access_expired",
          provider: model.provider,
          modelId: model.id,
          details: { reason: "free_access_unverified" },
        });
      }
    }
    return rows.length;
  });
}
export async function runMaintenanceTick(
  options: {
    signal?: AbortSignal;
    now?: number;
    execute?: (key: string, signal: AbortSignal) => Promise<unknown>;
  } = {},
) {
  const now = options.now ?? Date.now();
  const owner = randomUUID();
  const abort = new AbortController();
  const signal = AbortSignal.any([
    abort.signal,
    ...(options.signal ? [options.signal] : []),
  ]);
  let held = false;
  const lock = postgres(process.env.DATABASE_URL!, {
    max: 1,
    idle_timeout: 0,
    max_lifetime: 0,
    onclose: () => {
      if (held) abort.abort();
    },
  });
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    const [acquired] =
      await lock`select pg_try_advisory_lock(21465,3) as locked`;
    if (!acquired.locked) return { status: "busy" };
    held = true;
    await initializeJobs(now);
    const key = await claimJob(owner, now);
    if (!key) return { status: "idle" };
    heartbeat = setInterval(() => {
      void lock`select 1`.catch(() => abort.abort());
      void db
        .update(maintenanceJobs)
        .set({ leaseUntil: new Date(Date.now() + 5 * MINUTE) })
        .where(
          and(
            eq(maintenanceJobs.key, key),
            eq(maintenanceJobs.leaseOwner, owner),
          ),
        )
        .catch(() => abort.abort());
    }, 15000);
    try {
      if (options.execute) await options.execute(key, signal);
      else if (key === "probes") await runDueProbes(signal, now);
      else if (key === "retirements") await applyScheduledRetirements(now);
      else if (key.startsWith("notice:"))
        await monitorNotice(key.split(":")[1] as Provider, signal);
      else {
        const [, provider, mode] = key.split(":");
        await applyCatalog(
          await collectCatalog(provider as Provider, signal),
          mode === "weekly",
        );
      }
      signal.throwIfAborted();
      await db
        .update(maintenanceJobs)
        .set({
          nextRunAt: nextJobAt(key, options.now ?? Date.now()),
          lastFinishedAt: new Date(),
          lastError: null,
          leaseOwner: null,
          leaseUntil: null,
        })
        .where(
          and(
            eq(maintenanceJobs.key, key),
            eq(maintenanceJobs.leaseOwner, owner),
          ),
        );
      return { status: "completed", key };
    } catch (error) {
      const failure = normalizeProviderError(error);
      const provider = key.split(":")[1];
      if (
        key.startsWith("catalog:") &&
        ["authentication", "permission", "quota"].includes(failure.category)
      )
        await recordProviderFailure(provider, failure);

      await db
        .update(maintenanceJobs)
        .set({
          nextRunAt: new Date(Date.now() + HOUR),
          lastError: failure.category,
          leaseOwner: null,
          leaseUntil: null,
        })
        .where(
          and(
            eq(maintenanceJobs.key, key),
            eq(maintenanceJobs.leaseOwner, owner),
          ),
        );
      await db.insert(maintenanceEvents).values({
        kind: "maintenance_failed",
        provider,
        details: { job: key, category: failure.category },
      });
      return { status: "failed", key };
    }
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    if (held) {
      try {
        await lock`select pg_advisory_unlock(21465,3)`;
      } catch {}
    }
    held = false;
    await lock.end({ timeout: 1 });
  }
}
export async function maintenanceLoop(signal: AbortSignal) {
  if (process.env.AI_MAINTENANCE_ENABLED !== "true")
    throw Error("AI maintenance is disabled");
  while (!signal.aborted) {
    const result = await runMaintenanceTick({ signal });
    if (result.status === "failed")
      console.warn("Maintenance job failed", result.key);
    if (result.status === "completed")
      console.log("Maintenance job completed", result.key);
    await delay(
      ["completed", "failed"].includes(result.status) ? 1000 : 15 * MINUTE,
      undefined,
      {
        signal,
      },
    ).catch(() => {});
  }
}
