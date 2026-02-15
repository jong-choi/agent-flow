import { cache } from "react";
import { cacheTag } from "next/cache";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import "server-only";
import { db } from "@/db/client";
import {
  type CursorOptions,
  buildCursorOrderBy,
  buildCursorWhere,
  toCursorTimestamp,
} from "@/db/query/cursor";
import {
  creditAccounts,
  creditDailyEvents,
  type creditTransactionCategories,
  type creditTransactionTypes,
  creditTransactions,
} from "@/db/schema/credit";
import { getUserId } from "@/features/auth/server/queries";
import { creditTags } from "@/features/credits/server/cache/tags";

export type CreditTransactionType = (typeof creditTransactionTypes)[number];
export type CreditTransactionCategory =
  (typeof creditTransactionCategories)[number];

const DAILY_ATTENDANCE_REWARD = 100;

export type TransactionResult = {
  id: string;
  type: CreditTransactionType;
  category: CreditTransactionCategory;
  title: string;
  description: string | null;
  amount: number;
  occurredAt: string;
};

export type CreditSummary = {
  balance: number;
  monthlyEarned: number;
  monthlySpent: number;
  totalEarned: number;
  recentTransactions: Array<TransactionResult>;
};

export type CreditHistoryFilters = {
  from?: Date | string;
  to?: Date | string;
  type?: "all" | CreditTransactionType;
  limit?: number;
};

export type CreditHistoryResult = {
  transactions: Array<TransactionResult>;
  range: { from: Date; to: Date };
  totalCount: number;
  totalAmount: number;
  pageInfo: {
    hasPrev: boolean;
    hasNext: boolean;
    prevCursor: string | null;
    nextCursor: string | null;
  };
};

export type WeeklyAttendanceItem = {
  day: string;
  date: string;
  checked: boolean;
  reward: number;
  isToday: boolean;
};

export type CreditAttendanceSummary = {
  hasCheckedToday: boolean;
  weeklyAttendance: WeeklyAttendanceItem[];
  currentStreak: number;
  bestStreak: number;
  totalAttendance: number;
  dailyReward: number;
};

export type CreditAttendanceStatus = {
  hasCheckedToday: boolean;
  dailyReward: number;
};

const CREDIT_TIME_ZONE = "Asia/Seoul";

const toDateKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: CREDIT_TIME_ZONE }).format(
    value,
  );

const resolveSafeDate = (value: Date | string | undefined, fallback: Date) => {
  if (!value) {
    return fallback;
  }

  const resolved = new Date(value);
  return Number.isNaN(resolved.getTime()) ? fallback : resolved;
};

const getCreditAccountByUserIdCached = cache(async (userId: string) => {
  "use cache";
  cacheTag(creditTags.allByUser(userId));
  cacheTag(creditTags.balanceByUser(userId));
  cacheTag(creditTags.summaryByUser(userId));

  const [account] = await db
    .select({
      balance: creditAccounts.balance,
      totalEarned: creditAccounts.totalEarned,
      totalSpent: creditAccounts.totalSpent,
    })
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);

  return (
    account ?? {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    }
  );
});

export const getCreditBalanceByUserId = async (userId: string) => {
  const account = await getCreditAccountByUserIdCached(userId);
  return account.balance;
};

export const getCreditBalance = async () => {
  const userId = await getUserId();
  const account = await getCreditAccountByUserIdCached(userId);
  return account.balance;
};

export const getCreditSummary = async (): Promise<CreditSummary> => {
  const userId = await getUserId();
  const monthStart = startOfMonth(new Date());

  return getCreditSummaryCached(userId, monthStart.toISOString());
};

const getCreditSummaryCached = cache(
  async (userId: string, monthStartIso: string): Promise<CreditSummary> => {
    "use cache";
    cacheTag(creditTags.allByUser(userId));
    cacheTag(creditTags.summaryByUser(userId));
    cacheTag(creditTags.balanceByUser(userId));

    const account = await getCreditAccountByUserIdCached(userId);
    const monthStart = new Date(monthStartIso);

    const monthlyEarnedSql = sql<number>`
    coalesce(sum(case when ${creditTransactions.amount} > 0
      then ${creditTransactions.amount} else 0 end), 0)
  `.mapWith(Number);

    const monthlySpentSql = sql<number>`
    coalesce(sum(case when ${creditTransactions.amount} < 0
      then -${creditTransactions.amount} else 0 end), 0)
  `.mapWith(Number);

    const totalEarnedSql = sql<number>`
    coalesce(sum(case when ${creditTransactions.amount} > 0
      then ${creditTransactions.amount} else 0 end), 0)
  `.mapWith(Number);

    const [recentTransactions, [monthlyTotals], [totalTotals]] =
      await Promise.all([
        db
          .select({
            id: creditTransactions.id,
            type: creditTransactions.type,
            category: creditTransactions.category,
            title: creditTransactions.title,
            description: creditTransactions.description,
            amount: creditTransactions.amount,
            occurredAt: creditTransactions.occurredAt,
          })
          .from(creditTransactions)
          .where(eq(creditTransactions.userId, userId))
          .orderBy(desc(creditTransactions.occurredAt))
          .limit(5),
        db
          .select({
            earned: monthlyEarnedSql,
            spent: monthlySpentSql,
          })
          .from(creditTransactions)
          .where(
            and(
              eq(creditTransactions.userId, userId),
              gte(creditTransactions.occurredAt, monthStart),
            ),
          ),
        db
          .select({
            totalEarned: totalEarnedSql,
          })
          .from(creditTransactions)
          .where(eq(creditTransactions.userId, userId)),
      ]);

    return {
      balance: account.balance,
      monthlyEarned: monthlyTotals?.earned ?? 0,
      monthlySpent: monthlyTotals?.spent ?? 0,
      totalEarned: totalTotals?.totalEarned ?? 0,
      recentTransactions: recentTransactions.map((transaction) => ({
        ...transaction,
        occurredAt: transaction.occurredAt.toISOString(),
      })),
    };
  },
);

export const getCreditHistory = async (
  filters?: CreditHistoryFilters,
  options?: CursorOptions,
): Promise<CreditHistoryResult> => {
  const userId = await getUserId();

  const now = new Date();
  const to = resolveSafeDate(filters?.to, now);
  const from = resolveSafeDate(filters?.from, subMonths(to, 6));
  const cursor = options?.cursor?.trim() ?? "";
  const dir = options?.dir === "prev" ? "prev" : "next";
  const limitValue =
    typeof options?.limit === "number"
      ? options.limit
      : typeof filters?.limit === "number"
        ? filters.limit
        : 30;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  const type =
    filters?.type === "earn" || filters?.type === "spend"
      ? filters.type
      : "all";

  return getCreditHistoryCached(
    userId,
    from.toISOString(),
    to.toISOString(),
    type,
    cursor,
    dir,
    limit,
  );
};

const getCreditHistoryCached = cache(
  async (
    userId: string,
    fromIso: string,
    toIso: string,
    type: "all" | CreditTransactionType,
    cursor: string,
    dir: "next" | "prev",
    limit: number,
  ): Promise<CreditHistoryResult> => {
    "use cache";
    cacheTag(creditTags.allByUser(userId));
    cacheTag(creditTags.historyByUser(userId));

    const from = new Date(fromIso);
    const to = new Date(toIso);

    const clauses = [
      eq(creditTransactions.userId, userId),
      gte(creditTransactions.occurredAt, startOfDay(from)),
      lte(creditTransactions.occurredAt, endOfDay(to)),
    ];

    if (type !== "all") {
      clauses.push(eq(creditTransactions.type, type));
    }

    const whereClause = and(...clauses);
    if (!whereClause) {
      return {
        range: { from, to },
        totalCount: 0,
        totalAmount: 0,
        pageInfo: {
          hasPrev: false,
          hasNext: false,
          prevCursor: null,
          nextCursor: null,
        },
        transactions: [],
      };
    }

    let cursorAnchor: { id: string; occurredAt: string } | null = null;
    if (cursor) {
      const [anchor] = await db
        .select({
          id: creditTransactions.id,
          occurredAt: toCursorTimestamp(creditTransactions.occurredAt),
        })
        .from(creditTransactions)
        .where(and(whereClause, eq(creditTransactions.id, cursor)))
        .limit(1);
      cursorAnchor = anchor ?? null;
    }

    const appliedDir = cursorAnchor && dir === "prev" ? "prev" : "next";
    const orderBy = buildCursorOrderBy(
      [
        { value: creditTransactions.occurredAt, direction: "desc" },
        { value: creditTransactions.id, direction: "desc" },
      ],
      appliedDir,
    );

    let listWhere = whereClause;
    if (cursorAnchor) {
      const cursorWhere = buildCursorWhere(
        [
          {
            value: creditTransactions.occurredAt,
            cursor: cursorAnchor.occurredAt,
            direction: "desc",
          },
          {
            value: creditTransactions.id,
            cursor: cursorAnchor.id,
            direction: "desc",
          },
        ],
        appliedDir,
      );

      if (cursorWhere) {
        const mergedWhere = and(whereClause, cursorWhere);
        if (mergedWhere) {
          listWhere = mergedWhere;
        }
      }
    }

    const [rows, [summary]] = await Promise.all([
      db
        .select({
          id: creditTransactions.id,
          type: creditTransactions.type,
          category: creditTransactions.category,
          title: creditTransactions.title,
          description: creditTransactions.description,
          amount: creditTransactions.amount,
          occurredAt: creditTransactions.occurredAt,
        })
        .from(creditTransactions)
        .where(listWhere)
        .orderBy(...orderBy)
        .limit(limit + 1),
      db
        .select({
          totalCount: sql<number>`count(*)`.mapWith(Number),
          totalAmount:
            sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`.mapWith(
              Number,
            ),
        })
        .from(creditTransactions)
        .where(whereClause),
    ]);

    const hasMore = rows.length > limit;
    const slicedRows = rows.slice(0, limit);
    const normalizedRows =
      appliedDir === "prev" ? [...slicedRows].reverse() : slicedRows;
    const hasPrev = appliedDir === "prev" ? hasMore : Boolean(cursorAnchor);
    const hasNext = appliedDir === "prev" ? Boolean(cursorAnchor) : hasMore;
    const prevCursor = hasPrev ? (normalizedRows[0]?.id ?? null) : null;
    const nextCursor = hasNext
      ? (normalizedRows[normalizedRows.length - 1]?.id ?? null)
      : null;

    return {
      range: { from, to },
      totalCount: summary?.totalCount ?? 0,
      totalAmount: summary?.totalAmount ?? 0,
      pageInfo: {
        hasPrev,
        hasNext,
        prevCursor,
        nextCursor,
      },
      transactions: normalizedRows.map((row) => ({
        ...row,
        occurredAt: row.occurredAt.toISOString(),
      })),
    };
  },
);

export const getCreditAttendanceSummary =
  async (): Promise<CreditAttendanceSummary> => {
    const userId = await getUserId();
    const todayKey = toDateKey(new Date());

    return getCreditAttendanceSummaryCached(userId, todayKey);
  };

const getCreditAttendanceSummaryCached = cache(
  async (
    userId: string,
    todayKey: string,
  ): Promise<CreditAttendanceSummary> => {
    "use cache";
    cacheTag(creditTags.allByUser(userId));
    cacheTag(creditTags.attendanceByUser(userId));

    const today = startOfDay(parseISO(todayKey));
    const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
    const weekEndDate = addDays(weekStartDate, 6);
    const weekStart = format(weekStartDate, "yyyy-MM-dd");
    const weekEnd = format(weekEndDate, "yyyy-MM-dd");

    const [eventsThisWeek, allEvents] = await Promise.all([
      db
        .select({
          eventDate: creditDailyEvents.eventDate,
          reward: creditDailyEvents.reward,
        })
        .from(creditDailyEvents)
        .where(
          and(
            eq(creditDailyEvents.userId, userId),
            gte(creditDailyEvents.eventDate, weekStart),
            lte(creditDailyEvents.eventDate, weekEnd),
          ),
        )
        .orderBy(asc(creditDailyEvents.eventDate)),
      db
        .select({
          eventDate: creditDailyEvents.eventDate,
        })
        .from(creditDailyEvents)
        .where(eq(creditDailyEvents.userId, userId))
        .orderBy(asc(creditDailyEvents.eventDate)),
    ]);

    const eventMap = new Map(
      eventsThisWeek.map((event) => [event.eventDate, event.reward]),
    );

    const weeklyAttendance = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStartDate, index);
      const key = format(date, "yyyy-MM-dd");
      const checked = eventMap.has(key);
      const reward = eventMap.get(key) ?? DAILY_ATTENDANCE_REWARD;

      return {
        day: format(date, "EEE", { locale: ko }),
        date: format(date, "MM/dd"),
        checked,
        reward,
        isToday: differenceInCalendarDays(date, today) === 0,
      };
    });

    let bestStreak = 0;
    let latestStreak = 0;
    let prevDate: Date | null = null;

    allEvents.forEach((event) => {
      const currentDate = startOfDay(parseISO(event.eventDate));
      if (prevDate) {
        const diff = differenceInCalendarDays(currentDate, prevDate);
        if (diff === 1) {
          latestStreak += 1;
        } else if (diff > 1) {
          latestStreak = 1;
        }
      } else {
        latestStreak = 1;
      }
      bestStreak = Math.max(bestStreak, latestStreak);
      prevDate = currentDate;
    });

    const lastEventDate = prevDate;
    const diffToToday = lastEventDate
      ? differenceInCalendarDays(today, lastEventDate)
      : Number.POSITIVE_INFINITY;

    const currentStreak = diffToToday <= 1 ? latestStreak : 0;

    return {
      hasCheckedToday: eventMap.has(todayKey),
      weeklyAttendance,
      currentStreak,
      bestStreak,
      totalAttendance: allEvents.length,
      dailyReward: DAILY_ATTENDANCE_REWARD,
    };
  },
);

export const getDailyAttendanceStatus =
  async (): Promise<CreditAttendanceStatus> => {
    const userId = await getUserId();
    const todayKey = toDateKey(new Date());

    return getDailyAttendanceStatusCached(userId, todayKey);
  };

const getDailyAttendanceStatusCached = cache(
  async (userId: string, todayKey: string): Promise<CreditAttendanceStatus> => {
    "use cache";
    cacheTag(creditTags.allByUser(userId));
    cacheTag(creditTags.attendanceByUser(userId));

    const [event] = await db
      .select({ eventDate: creditDailyEvents.eventDate })
      .from(creditDailyEvents)
      .where(
        and(
          eq(creditDailyEvents.userId, userId),
          eq(creditDailyEvents.eventDate, todayKey),
        ),
      )
      .limit(1);

    return {
      hasCheckedToday: Boolean(event),
      dailyReward: DAILY_ATTENDANCE_REWARD,
    };
  },
);
