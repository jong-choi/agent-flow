import { and, eq, sql } from "drizzle-orm";
import {
  AIMessage,
  type AIMessageChunk,
  HumanMessage,
} from "@langchain/core/messages";
import { db } from "@/db/client";
import {
  freeAccessPolicies,
  modelHealth,
  probeBudgets,
  providerHealth,
} from "@/db/schema/ai-maintenance";
import { aiModels } from "@/db/schema/ai-models";
import { createProviderModel } from "../adapters";
import { runAiCall } from "../execution";
import { assertCompleteAnswer, getAnswerText } from "../message";
import { listModelRegistry } from "../registry-store";
import { supportedThinkingLevels } from "../thinking";
import { isChatCatalogModel } from "./collectors";
import { DAY, initialHealth, readHealth } from "./policy";
import { credentialVersion } from "./state-store";

export async function reserveProbe(
  provider: string,
  now = Date.now(),
  amount = 1,
) {
  const day = new Date(now).toISOString().slice(0, 10);
  return db.transaction(async (tx) => {
    await tx
      .insert(probeBudgets)
      .values({ provider, day, used: 0 })
      .onConflictDoNothing();
    const [row] = await tx
      .update(probeBudgets)
      .set({ used: sql`${probeBudgets.used}+${amount}` })
      .where(
        and(
          eq(probeBudgets.provider, provider),
          eq(probeBudgets.day, day),
          sql`${probeBudgets.used}+${amount}<=10`,
        ),
      )
      .returning();
    return Boolean(row);
  });
}
export async function probeModel(
  id: string,
  options: { signal?: AbortSignal; verifyCandidate?: boolean } = {},
) {
  const model = (await listModelRegistry()).find((m) => m.id === id);
  if (!model || model.lifecycle === "retired") return { status: "skipped" };
  if (
    model.retirementSourceUrl &&
    model.retirementAt &&
    model.retirementAt.getTime() <= Date.now()
  )
    return { status: "skipped" };
  if (options.verifyCandidate && model.promotionBlocked)
    return { status: "manual_hold" };
  if (!isChatCatalogModel(model.provider, model.upstreamModelId))
    return { status: "unsupported_model" };
  const count = options.verifyCandidate ? 2 : 1;
  if (model.requireFreeAccess || model.lifecycle === "candidate") {
    const [policy] = await db
      .select()
      .from(freeAccessPolicies)
      .where(eq(freeAccessPolicies.provider, model.provider));
    if (
      !policy ||
      policy.credentialVersion !== credentialVersion(model.provider) ||
      policy.expiresAt.getTime() <= Date.now() ||
      !policy.modelIds.includes(model.upstreamModelId)
    )
      return { status: "free_verification_required" };
  }
  if (options.verifyCandidate && model.price === null)
    return { status: "price_required" };
  if (!(await reserveProbe(model.provider, Date.now(), count)))
    return { status: "budget_exhausted" };
  const levels = supportedThinkingLevels(model.provider, model.upstreamModelId);
  const sample = {
    ...model,
    appMaxOutputTokens: 512,
    metadata: {
      ...model.metadata,
      thinkingLevel: levels.includes("minimal")
        ? ("minimal" as const)
        : levels.includes("low")
          ? ("low" as const)
          : ("default" as const),
    },
  };
  const llm = createProviderModel(sample);
  if (!llm) return { status: "unsupported_adapter" };
  try {
    const input = [
      new HumanMessage("한국어로 한 문장만 답해. 12분과 8분의 합은?"),
    ];
    const first = await runAiCall((signal) => llm.invoke(input, { signal }), {
      signal: options.signal,
      timeoutMs: 60000,
      observe: { model, source: "probe" },
    });
    assertCompleteAnswer(first);
    if (options.verifyCandidate) {
      let text = "";
      await runAiCall(
        async (signal) => {
          let combined: AIMessageChunk | undefined;
          for await (const chunk of await llm.stream(
            [
              ...input,
              new AIMessage(getAnswerText(first.content)),
              new HumanMessage(
                "두 독립 작업을 병렬 실행하면 몇 분 걸려? 한 문장만 답해.",
              ),
            ],
            { signal },
          )) {
            text += getAnswerText(chunk.content);
            combined = combined ? combined.concat(chunk) : chunk;
          }
          return combined ?? new AIMessage("");
        },
        {
          signal: options.signal,
          timeoutMs: 60000,
          observe: { model, source: "probe" },
        },
      );
      if (!text.trim()) throw Error("Empty candidate stream");
    }
    // Recheck policy and operator decisions after the network round-trip under the
    // same mutation lock used by retirement and catalog updates.
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
      const [current] = await tx
        .select()
        .from(aiModels)
        .where(eq(aiModels.id, id));
      if (
        !current ||
        current.lifecycle === "retired" ||
        current.promotionBlocked ||
        (current.retirementAt && current.retirementAt.getTime() <= Date.now())
      )
        return "skipped";
      if (current.requireFreeAccess || current.lifecycle === "candidate") {
        const [policy] = await tx
          .select()
          .from(freeAccessPolicies)
          .where(eq(freeAccessPolicies.provider, current.provider));
        if (
          !policy ||
          policy.credentialVersion !== credentialVersion(current.provider) ||
          policy.expiresAt.getTime() <= Date.now() ||
          !policy.modelIds.includes(current.upstreamModelId)
        )
          return "free_verification_required";
      }
      if (options.verifyCandidate && current.lifecycle === "candidate") {
        if (current.price === null) return "price_required";
        await tx
          .update(aiModels)
          .set({
            lifecycle: "active",
            entitlement: "free_confirmed",
            isActive: true,
            health: "healthy",
            updatedAt: new Date(),
          })
          .where(eq(aiModels.id, id));
        const state = {
          ...initialHealth(),
          lastSuccessAt: Date.now(),
          nextProbeAt: Date.now() + DAY,
        };
        await tx
          .insert(modelHealth)
          .values({ modelId: id, state })
          .onConflictDoUpdate({
            target: modelHealth.modelId,
            set: { state, updatedAt: new Date() },
          });
      } else if (current.requireFreeAccess) {
        await tx
          .update(aiModels)
          .set({ entitlement: "free_confirmed" })
          .where(eq(aiModels.id, id));
      }
      return "passed";
    });
    return { status: outcome };
  } catch {
    return { status: "failed" };
  }
}
export async function runDueProbes(signal?: AbortSignal, now = Date.now()) {
  const models = await listModelRegistry();
  const states = await db.select().from(modelHealth);
  const providers = await db.select().from(providerHealth);
  const results = [];
  for (const provider of ["google", "groq", "ollama"]) {
    const state = providers.find(
      (p) =>
        p.provider === provider &&
        p.credentialVersion === credentialVersion(provider),
    );
    if (
      state &&
      state.state.status !== "healthy" &&
      (state.state.nextProbeAt ?? Infinity) > now
    )
      continue;
    const candidates = models.filter(
      (m) =>
        m.provider === provider &&
        m.lifecycle !== "retired" &&
        (m.isActive || m.lifecycle === "candidate"),
    );
    const due = candidates.filter((m) => {
      const s = readHealth(states.find((s) => s.modelId === m.id)?.state);
      return (
        (m.lifecycle !== "candidate" &&
          state?.state.status !== "healthy" &&
          (state?.state.nextProbeAt ?? Infinity) <= now) ||
        (m.requireFreeAccess && m.entitlement !== "free_confirmed") ||
        (s.nextProbeAt ??
          (s.lastSuccessAt === null ? 0 : s.lastSuccessAt + DAY)) <= now
      );
    });
    // Prioritize recovery over new candidates, so discovery cannot starve existing service.
    due.sort(
      (a, b) =>
        Number(b.id === state?.state.probeModelId) -
          Number(a.id === state?.state.probeModelId) ||
        Number(a.lifecycle === "candidate") -
          Number(b.lifecycle === "candidate"),
    );
    for (const model of due) {
      const result = await probeModel(model.id, {
        signal,
        verifyCandidate: model.lifecycle === "candidate",
      });
      results.push({ id: model.id, ...result });
      if (["passed", "failed", "budget_exhausted"].includes(result.status))
        break;
    }
  }
  return results;
}
