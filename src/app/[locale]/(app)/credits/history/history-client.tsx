"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInMonths, format, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CreditTransactionType = "earn" | "spend";
type CreditTransactionCategory =
  | "attendance"
  | "workflow"
  | "preset_sale"
  | "preset_purchase"
  | "manual_adjustment";

// DB에 저장될 형태를 고려한 트랜잭션 구조
type CreditTransaction = {
  id: string;
  type: CreditTransactionType;
  category: CreditTransactionCategory;
  title: string;
  description?: string | null;
  amount: number;
  occurredAt: string;
};

const TRANSACTION_TYPE_META = {
  earn: {
    label: "획득",
    badgeClass: "border border-chart-2/30 bg-chart-2/10 text-chart-2",
    amountClass: "text-chart-2",
  },
  spend: {
    label: "사용",
    badgeClass: "border border-chart-1/30 bg-chart-1/10 text-chart-1",
    amountClass: "text-chart-1",
  },
} as const;

const TRANSACTION_CATEGORY_LABELS: Record<CreditTransactionCategory, string> = {
  attendance: "출석",
  workflow: "워크플로우",
  preset_sale: "프리셋 판매",
  preset_purchase: "프리셋 구매",
  manual_adjustment: "수동 조정",
};

const formatAmount = (amount: number) =>
  `${amount > 0 ? "+" : ""}${amount.toLocaleString()}`;

const formatTimestamp = (value: string) =>
  format(new Date(value), "yyyy.MM.dd HH:mm");

const FILTER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "획득", value: "earn" },
  { label: "사용", value: "spend" },
] as const;

type TypeFilter = (typeof FILTER_OPTIONS)[number]["value"];

const isTypeFilter = (value: string): value is TypeFilter =>
  FILTER_OPTIONS.some((option) => option.value === value);

const QUICK_PERIOD_OPTIONS = [
  { label: "최근 1개월", value: "1month" },
  { label: "최근 3개월", value: "3months" },
  { label: "최근 6개월", value: "6months" },
];

type CreditsHistoryClientProps = {
  transactions: CreditTransaction[];
};

export function CreditsHistoryClient({
  transactions,
}: CreditsHistoryClientProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  // 기본값: 최근 1개월
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  const [dateError, setDateError] = useState<string>("");

  const handleQuickPeriod = (value: string) => {
    const today = new Date();
    let from: Date;

    switch (value) {
      case "1month":
        from = subMonths(today, 1);
        break;
      case "3months":
        from = subMonths(today, 3);
        break;
      case "6months":
        from = subMonths(today, 6);
        break;
      default:
        return;
    }

    setDateRange({ from, to: today });
    setDateError("");
  };

  // 날짜 범위 변경 핸들러 (6개월 제한)
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      setDateRange(range);
      setDateError("");
      return;
    }

    // 6개월 초과 체크
    const monthsDiff = differenceInMonths(range.to, range.from);

    if (monthsDiff > 6) {
      setDateError("최대 6개월까지만 조회할 수 있습니다.");
      // 자동으로 6개월로 조정
      const adjustedFrom = subMonths(range.to, 6);
      setDateRange({ from: adjustedFrom, to: range.to });
    } else {
      setDateRange(range);
      setDateError("");
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }

    if (dateRange?.from || dateRange?.to) {
      const transactionDate = new Date(transaction.occurredAt);

      if (dateRange.from && transactionDate < dateRange.from) {
        return false;
      }

      if (dateRange.to) {
        const toEndOfDay = new Date(dateRange.to);
        toEndOfDay.setHours(23, 59, 59, 999);
        if (transactionDate > toEndOfDay) {
          return false;
        }
      }
    }

    return true;
  });

  const totalEarned = filteredTransactions
    .filter((t) => t.type === "earn")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(
    filteredTransactions
      .filter((t) => t.type === "spend")
      .reduce((sum, t) => sum + t.amount, 0),
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/credits">
            <Button variant="ghost" size="sm" className="mb-2">
              ← 돌아가기
            </Button>
          </Link>
          <h1 className="mb-2 text-3xl font-bold">거래 내역</h1>
          <p className="text-muted-foreground">
            모든 크레딧 획득 및 사용 내역을 확인하세요
          </p>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              총 획득
              {dateRange?.from && dateRange?.to && (
                <span className="ml-2 text-xs">
                  ({format(dateRange.from, "yy.MM.dd")} ~{" "}
                  {format(dateRange.to, "yy.MM.dd")})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">
              +{totalEarned.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>
              총 사용
              {dateRange?.from && dateRange?.to && (
                <span className="ml-2 text-xs">
                  ({format(dateRange.from, "yy.MM.dd")} ~{" "}
                  {format(dateRange.to, "yy.MM.dd")})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              -{totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">유형</label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    if (isTypeFilter(value)) {
                      setTypeFilter(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium">
                  기간 선택 (최대 6개월)
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "PPP", { locale: ko })} -{" "}
                            {format(dateRange.to, "PPP", { locale: ko })}
                          </>
                        ) : (
                          format(dateRange.from, "PPP", { locale: ko })
                        )
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      autoFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      locale={ko}
                      disabled={(date) => {
                        // 미래 날짜 비활성화
                        return date > new Date();
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {dateError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p>{dateError}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                빠른 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_PERIOD_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            거래 내역 ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              해당 기간에 거래 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const typeMeta = TRANSACTION_TYPE_META[transaction.type];
                return (
                  <div key={transaction.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${typeMeta.badgeClass} text-xs`}
                          >
                            {typeMeta.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                          </Badge>
                          <span className="font-medium">
                            {transaction.title}
                          </span>
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-muted-foreground">
                            {transaction.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(transaction.occurredAt)}
                        </div>
                      </div>
                      <div
                        className={`text-lg font-semibold ${typeMeta.amountClass}`}
                      >
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
