"use server";

import { revalidateTag } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import {
  creditAccounts,
  creditDailyEvents,
  creditTransactions,
} from "@/db/schema/credit";
import { creditTags } from "@/features/credits/server/cache/tags";
import {
  type CreditTransactionCategory,
  DAILY_ATTENDANCE_REWARD,
  getCreditBalance,
  toDateKey,
} from "@/features/credits/server/queries";

export type SpendCreditsByUserIdResult =
  | { ok: true; balance: number }
  | { ok: false; reason: "insufficient_credit"; balance: number };

export type AttendanceClaimResult = {
  credited: boolean;
  reward: number;
  balance: number;
  reason: "already_claimed" | null;
};

const revalidateCreditTags = (
  userId: string,
  options?: { includeAttendance?: boolean },
) => {
  revalidateTag(creditTags.allByUser(userId), "max");
  revalidateTag(creditTags.balanceByUser(userId), "max");
  revalidateTag(creditTags.summaryByUser(userId), "max");
  revalidateTag(creditTags.historyByUser(userId), "max");

  if (options?.includeAttendance) {
    revalidateTag(creditTags.attendanceByUser(userId), "max");
  }
};

const ensureCreditAccountForWrite = async (userId: string) => {
  await db.insert(creditAccounts).values({ userId }).onConflictDoNothing();
};

export const spendCreditsByUserId = async ({
  userId,
  amount,
  category,
  title,
  description,
}: {
  userId: string;
  amount: number;
  category: CreditTransactionCategory;
  title: string;
  description?: string | null;
}): Promise<SpendCreditsByUserIdResult> => {
  const normalizedAmount = Number.isFinite(amount)
    ? Math.max(0, Math.round(amount))
    : 0;

  if (normalizedAmount === 0) {
    const balance = await getCreditBalanceByUserIdAction({ userId });
    return { ok: true, balance };
  }

  const occurredAt = new Date();

  const result = await db.transaction<SpendCreditsByUserIdResult>(
    async (tx): Promise<SpendCreditsByUserIdResult> => {
    await tx.insert(creditAccounts).values({ userId }).onConflictDoNothing();

    const [accountSnapshot] = await tx
      .select({ balance: creditAccounts.balance })
      .from(creditAccounts)
      .where(eq(creditAccounts.userId, userId))
      .limit(1);

    const [account] = await tx
      .update(creditAccounts)
      .set({
        balance: sql`${creditAccounts.balance} - ${normalizedAmount}`,
        totalSpent: sql`${creditAccounts.totalSpent} + ${normalizedAmount}`,
        updatedAt: occurredAt,
      })
      .where(
        and(
          eq(creditAccounts.userId, userId),
          gte(creditAccounts.balance, normalizedAmount),
        ),
      )
      .returning({ balance: creditAccounts.balance });

    if (!account) {
      return {
        ok: false,
        reason: "insufficient_credit",
        balance: accountSnapshot?.balance ?? 0,
      };
    }

    await tx.insert(creditTransactions).values({
      userId,
      type: "spend",
      category,
      title,
      description: description ?? null,
      amount: -normalizedAmount,
      occurredAt,
    });

    return { ok: true, balance: account.balance };
    },
  );

  if (result.ok) {
    revalidateCreditTags(userId);
  }

  return result;
};

export const claimDailyAttendance =
  async (): Promise<AttendanceClaimResult> => {
    const userId = await getUserId();
    const todayKey = toDateKey(new Date());

    const result = await db.transaction<AttendanceClaimResult>(
      async (tx): Promise<AttendanceClaimResult> => {
      await tx.insert(creditAccounts).values({ userId }).onConflictDoNothing();

      const [accountSnapshot] = await tx
        .select({ balance: creditAccounts.balance })
        .from(creditAccounts)
        .where(eq(creditAccounts.userId, userId))
        .limit(1);

      const existingEvent = await tx
        .select({ eventDate: creditDailyEvents.eventDate })
        .from(creditDailyEvents)
        .where(
          and(
            eq(creditDailyEvents.userId, userId),
            eq(creditDailyEvents.eventDate, todayKey),
          ),
        )
        .limit(1);

      if (existingEvent.length > 0) {
        return {
          credited: false,
          reward: 0,
          balance: accountSnapshot?.balance ?? 0,
          reason: "already_claimed",
        };
      }

      const [event] = await tx
        .insert(creditDailyEvents)
        .values({
          userId,
          eventDate: todayKey,
          reward: DAILY_ATTENDANCE_REWARD,
        })
        .onConflictDoNothing()
        .returning({ eventDate: creditDailyEvents.eventDate });

      if (!event) {
        return {
          credited: false,
          reward: 0,
          balance: accountSnapshot?.balance ?? 0,
          reason: "already_claimed",
        };
      }

      await tx.insert(creditTransactions).values({
        userId,
        type: "earn",
        category: "attendance",
        title: "출석 체크",
        description: "일일 출석 보상",
        amount: DAILY_ATTENDANCE_REWARD,
        occurredAt: new Date(),
      });

      const [account] = await tx
        .update(creditAccounts)
        .set({
          balance: sql`${creditAccounts.balance} + ${DAILY_ATTENDANCE_REWARD}`,
          totalEarned: sql`${creditAccounts.totalEarned} + ${DAILY_ATTENDANCE_REWARD}`,
          updatedAt: new Date(),
        })
        .where(eq(creditAccounts.userId, userId))
        .returning({ balance: creditAccounts.balance });

      return {
        credited: true,
        reward: DAILY_ATTENDANCE_REWARD,
        balance: account?.balance ?? 0,
        reason: null,
      };
      },
    );

    if (result.credited) {
      revalidateCreditTags(userId, { includeAttendance: true });
    }

    return result;
  };

export const getCreditBalanceAction = async () => {
  await ensureCreditAccountForWrite(await getUserId());
  return getCreditBalance();
};

export const getCreditBalanceByUserIdAction = async ({
  userId,
}: {
  userId: string;
}) => {
  await ensureCreditAccountForWrite(userId);

  const [account] = await db
    .select({ balance: creditAccounts.balance })
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);

  return account?.balance ?? 0;
};
