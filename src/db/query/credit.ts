"use server";

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
import { db } from "@/db/client";
import {
  creditAccounts,
  creditDailyEvents,
  type creditTransactionCategories,
  type creditTransactionTypes,
  creditTransactions,
} from "@/db/schema/credit";

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

type CreditSummary = {
  balance: number;
  monthlyEarned: number;
  monthlySpent: number;
  totalEarned: number;
  recentTransactions: Array<TransactionResult>;
};

export type CreditHistoryFilters = {
  from?: Date;
  to?: Date;
  type?: "all" | CreditTransactionType;
  limit?: number;
};

export type CreditHistoryResult = {
  transactions: Array<TransactionResult>;
  range: { from: Date; to: Date };
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

type AttendanceClaimResult = {
  credited: boolean;
  reward: number;
  balance: number;
  reason: "already_claimed" | null;
};

const CREDIT_TIME_ZONE = "Asia/Seoul";

const toDateKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: CREDIT_TIME_ZONE }).format(
    value,
  );

const ensureCreditAccount = async (userId: string) => {
  await db.insert(creditAccounts).values({ userId }).onConflictDoNothing();

  const [account] = await db
    .select({
      balance: creditAccounts.balance,
      totalEarned: creditAccounts.totalEarned,
      totalSpent: creditAccounts.totalSpent,
    })
    .from(creditAccounts)
    .where(eq(creditAccounts.userId, userId))
    .limit(1);

  if (!account) {
    throw new Error("크레딧 계정을 찾을 수 없습니다.");
  }

  return account;
};

/**
 * 크레딧 잔액 단일 조회.
 * - 화면: 현재 직접 호출처 없음 (결제/차감 전 잔액 검증 등 공용 용도).
 * - 반환: credit_accounts.balance
 */
export const getCreditBalance = async (userId: string) => {
  const account = await ensureCreditAccount(userId);
  return account.balance;
};

/**
 * 크레딧 메인(/credits) 화면에 필요한 요약 정보 조회.
 * - 표시 데이터: 현재 잔액, 이번 달 획득/사용, 누적 획득, 최근 거래 5건.
 * - 사용처: src/app/credits/page.tsx
 */
export const getCreditSummary = async (
  userId: string,
): Promise<CreditSummary> => {
  const account = await ensureCreditAccount(userId);
  const monthStart = startOfMonth(new Date());

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
};

/**
 * 크레딧 거래 내역(/credits/history)용 리스트 조회.
 * - 표시 데이터: 기간/유형 필터 결과 목록.
 * - 제약: 조회 기간은 최대 6개월로 자동 보정.
 * - 사용처: src/app/credits/history/page.tsx
 */
export const getCreditHistory = async (
  userId: string,
  filters?: CreditHistoryFilters,
): Promise<CreditHistoryResult> => {
  const to = filters?.to ? new Date(filters.to) : new Date();
  const from = filters?.from ? new Date(filters.from) : subMonths(to, 6);

  const clauses = [
    eq(creditTransactions.userId, userId),
    gte(creditTransactions.occurredAt, startOfDay(from)),
    lte(creditTransactions.occurredAt, endOfDay(to)),
  ];

  if (filters?.type && filters.type !== "all") {
    clauses.push(eq(creditTransactions.type, filters.type));
  }

  const limit = filters?.limit ?? 500;

  const rows = await db
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
    .where(and(...clauses))
    .orderBy(desc(creditTransactions.occurredAt))
    .limit(limit);

  return {
    range: { from, to },
    transactions: rows.map((row) => ({
      ...row,
      occurredAt: row.occurredAt.toISOString(),
    })),
  };
};

/**
 * 출석 체크(/credits/attendance) 화면용 요약 데이터 조회.
 * - 표시 데이터: 주간 출석 그리드, 연속/최고/총 출석, 오늘 출석 여부/보상.
 * - 사용처: src/app/credits/attendance/page.tsx
 * - 참고: 출석 여부는 Korea(Asia/Seoul) 기준 날짜로 계산.
 */
export const getCreditAttendanceSummary = async (
  userId: string,
): Promise<CreditAttendanceSummary> => {
  const todayKey = toDateKey(new Date());
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
};

/**
 * 크레딧 메인(/credits)에서 출석 버튼 상태 확인용 경량 조회.
 * - 표시 데이터: 오늘 출석 여부 + 일일 보상 금액 문구.
 * - 사용처: src/app/credits/page.tsx
 */
export const getDailyAttendanceStatus = async (
  userId: string,
): Promise<CreditAttendanceStatus> => {
  const todayKey = toDateKey(new Date());
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
};

/**
 * 출석 체크 이벤트 처리(일일 1회).
 * - 사용처: src/app/api/credits/attendance/route.ts (POST)
 * - 동작: 오늘 출석 기록이 없을 때만 이벤트/거래/잔액을 생성·갱신.
 * - 중복 요청: 이미 출석한 경우 credited=false + reason="already_claimed".
 * - 참고: 날짜 기준은 Korea(Asia/Seoul).
 */
export const claimDailyAttendance = async (
  userId: string,
): Promise<AttendanceClaimResult> => {
  const todayKey = toDateKey(new Date());

  return db.transaction(async (tx) => {
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
  });
};
