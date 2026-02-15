"use server";

import { updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { creditAccounts } from "@/db/schema/credit";
import { getUserId } from "@/features/auth/server/queries";
import { creditTags } from "@/features/credits/server/cache/tags";
import { getCreditBalance } from "@/features/credits/server/queries";

const updateCreditTags = (
  userId: string,
  options?: { includeAttendance?: boolean },
) => {
  updateTag(creditTags.allByUser(userId));
  updateTag(creditTags.balanceByUser(userId));
  updateTag(creditTags.summaryByUser(userId));
  updateTag(creditTags.historyByUser(userId));

  if (options?.includeAttendance) {
    updateTag(creditTags.attendanceByUser(userId));
  }
};

export const updateCreditTagsByUserIds = async (
  userIds: string[],
  options?: { includeAttendance?: boolean },
) => {
  const uniqueUserIds = Array.from(new Set(userIds));
  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      updateCreditTags(userId, options);
    }),
  );
};

const ensureCreditAccountForWrite = async (userId: string) => {
  await db.insert(creditAccounts).values({ userId }).onConflictDoNothing();
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

export const updateCreditTagsAction = async (options?: {
  includeAttendance?: boolean;
}) => {
  const userId = await getUserId();
  updateCreditTags(userId, options);
};
