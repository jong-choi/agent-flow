import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { StoredMessage } from "@langchain/core/messages";
import { createApiError } from "@/app/api/_errors/api-error";
import { db } from "@/db/client";
import { aiExecutionBilling } from "@/db/schema/ai-billing";
import { type AiModel, aiModelExecutions } from "@/db/schema/ai-models";
import { creditAccounts, creditTransactions } from "@/db/schema/credit";
import { getModelLimits } from "./registry";

/** Call inside runAiCall: reservations start only after acquiring the generation lock. */
export async function reserveModelCredits(
  model: AiModel,
  context: {
    userId: string;
    threadId?: string;
    nodeId: string;
    executionKey: string;
  },
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${context.executionKey}, 0))`,
    );
    const [previous] = await tx
      .select()
      .from(aiExecutionBilling)
      .where(eq(aiExecutionBilling.executionKey, context.executionKey))
      .for("update");
    if (previous?.status === "settled")
      return { id: previous.executionId, cached: previous.result };
    if (previous?.status === "reserved")
      throw createApiError("invalidRequest", {
        message: "Model execution is already in progress.",
      });
    let execution;
    if (previous) {
      [execution] = await tx
        .select()
        .from(aiModelExecutions)
        .where(eq(aiModelExecutions.id, previous.executionId));
    } else {
      if (model.price === null) throw createApiError("invalidModel");
      const limits = getModelLimits(model);
      [execution] = await tx
        .insert(aiModelExecutions)
        .values({
          modelRegistryId: model.id,
          provider: model.provider,
          upstreamModelId: model.upstreamModelId,
          credits: model.price,
          inputLimit: limits.input,
          outputLimit: limits.output,
          userId: context.userId,
          threadId: context.threadId,
          nodeId: context.nodeId,
        })
        .returning();
    }
    if (
      !execution ||
      execution.userId !== context.userId ||
      execution.modelRegistryId !== model.id
    )
      throw createApiError("invalidRequest");
    await tx
      .insert(creditAccounts)
      .values({ userId: context.userId })
      .onConflictDoNothing();
    const [account] = await tx
      .update(creditAccounts)
      .set({
        balance: sql`${creditAccounts.balance}-${execution.credits}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(creditAccounts.userId, context.userId),
          gte(creditAccounts.balance, execution.credits),
        ),
      )
      .returning();
    if (!account) throw createApiError("insufficientCredit");
    const values = {
      executionId: execution.id,
      executionKey: context.executionKey,
      status: "reserved" as const,
      result: null,
      transactionId: null,
      expiresAt: new Date(Date.now() + 10 * 60_000),
      updatedAt: new Date(),
    };
    await tx.insert(aiExecutionBilling).values(values).onConflictDoUpdate({
      target: aiExecutionBilling.executionId,
      set: values,
    });
    await tx
      .update(aiModelExecutions)
      .set({ status: "running", completedAt: null })
      .where(eq(aiModelExecutions.id, execution.id));
    return { id: execution.id, cached: null };
  });
}
export async function settleModelCredits(
  id: string,
  result: StoredMessage[],
  description: string,
) {
  return db.transaction(async (tx) => {
    const [billing] = await tx
      .select()
      .from(aiExecutionBilling)
      .where(eq(aiExecutionBilling.executionId, id))
      .for("update");
    if (billing?.status === "settled") return;
    if (billing?.status !== "reserved")
      throw Error("No active credit reservation");
    const [execution] = await tx
      .select()
      .from(aiModelExecutions)
      .where(eq(aiModelExecutions.id, id));
    let transactionId: string | null = null;
    if (execution.credits > 0) {
      const [receipt] = await tx
        .insert(creditTransactions)
        .values({
          userId: execution.userId!,
          type: "spend",
          category: "workflow",
          title: "워크플로우 실행",
          description,
          amount: -execution.credits,
        })
        .returning({ id: creditTransactions.id });
      transactionId = receipt.id;
      await tx
        .update(creditAccounts)
        .set({
          totalSpent: sql`${creditAccounts.totalSpent}+${execution.credits}`,
          updatedAt: new Date(),
        })
        .where(eq(creditAccounts.userId, execution.userId!));
    }
    await tx
      .update(aiExecutionBilling)
      .set({ status: "settled", result, transactionId, updatedAt: new Date() })
      .where(eq(aiExecutionBilling.executionId, id));
    await tx
      .update(aiModelExecutions)
      .set({ status: "succeeded", completedAt: new Date() })
      .where(eq(aiModelExecutions.id, id));
  });
}
export async function releaseModelCredits(id: string) {
  await db.transaction(async (tx) => {
    const [billing] = await tx
      .select()
      .from(aiExecutionBilling)
      .where(eq(aiExecutionBilling.executionId, id))
      .for("update");
    if (billing?.status !== "reserved") return;
    const [execution] = await tx
      .select()
      .from(aiModelExecutions)
      .where(eq(aiModelExecutions.id, id));
    await tx
      .update(creditAccounts)
      .set({
        balance: sql`${creditAccounts.balance}+${execution.credits}`,
        updatedAt: new Date(),
      })
      .where(eq(creditAccounts.userId, execution.userId!));
    await tx
      .update(aiExecutionBilling)
      .set({ status: "released", updatedAt: new Date() })
      .where(eq(aiExecutionBilling.executionId, id));
    await tx
      .update(aiModelExecutions)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(aiModelExecutions.id, id));
  });
}
/** Only while holding runAiCall's global lock, so a live invocation cannot be reclaimed. */
export async function releaseExpiredModelCredits(now = new Date()) {
  const rows = await db
    .select({ id: aiExecutionBilling.executionId })
    .from(aiExecutionBilling)
    .where(
      and(
        eq(aiExecutionBilling.status, "reserved"),
        lte(aiExecutionBilling.expiresAt, now),
      ),
    );
  for (const row of rows) await releaseModelCredits(row.id);
  return rows.length;
}
