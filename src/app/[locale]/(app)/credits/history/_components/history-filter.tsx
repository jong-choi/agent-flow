"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addDays,
  differenceInCalendarDays,
  format,
  min,
  parseISO,
  subDays,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const TYPE_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "획득", value: "earn" },
  { label: "사용", value: "spend" },
] as const;

type TypeFilter = (typeof TYPE_OPTIONS)[number]["value"];

const QUICK_RANGES = [
  { label: "최근 1개월", months: 1 },
  { label: "최근 3개월", months: 3 },
  { label: "최근 6개월", months: 6 },
];

const formatDateInput = (value: Date) => format(value, "yyyy-MM-dd");

export function CreditHistoryFilter() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [selectedType, setSelectedType] = useState<TypeFilter>(
    type as TypeFilter,
  );
  const [fromInput, setFromInput] = useState<string>(from as string);
  const [toInput, setToInput] = useState<string>(to as string);

  const todayInput = formatDateInput(new Date());

  const today = new Date();

  const quickRanges = QUICK_RANGES.map((range) => {
    const quickTo = today;
    const quickFrom = subMonths(quickTo, range.months);
    const quickFromInput = formatDateInput(quickFrom);
    const quickToInput = formatDateInput(quickTo);

    return {
      label: range.label,
      months: range.months,
      from: quickFromInput,
      to: quickToInput,
      isActive: fromInput === quickFromInput && toInput === quickToInput,
    };
  });

  const getValidDate = (from: string, to: string, mode: "from" | "to") => {
    let fromDate = from ? parseISO(from) : new Date();
    let toDate = to ? parseISO(to) : new Date();

    if (fromDate > toDate) {
      fromDate = toDate;
    } else {
      const diff = differenceInCalendarDays(toDate, fromDate);
      if (diff > 180) {
        if (mode === "from") {
          toDate = min([addDays(fromDate, 180), new Date()]);
        } else {
          fromDate = subDays(toDate, 180);
        }
      }
    }

    return [formatDateInput(fromDate), formatDateInput(toDate)];
  };

  const handleQuickRange = (months: number) => {
    const quickTo = new Date();
    const quickFrom = subMonths(quickTo, months);
    setFromInput(formatDateInput(quickFrom));
    setToInput(formatDateInput(quickTo));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">필터</CardTitle>
        <CardDescription>
          유형과 기간을 선택하고 적용을 눌러 주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {quickRanges.map((range) => (
            <Button
              key={range.label}
              type="button"
              variant={range.isActive ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleQuickRange(range.months)}
            >
              {range.label}
            </Button>
          ))}
        </div>

        <form action="/credits/history" method="get" className="grid gap-4">
          <div className="space-y-2">
            <label
              htmlFor="credit-type"
              className="text-xs font-medium text-muted-foreground"
            >
              유형
            </label>
            <select
              id="credit-type"
              name="type"
              value={selectedType}
              onChange={(event) => {
                const value = event.target.value as TypeFilter;
                setSelectedType(value);
              }}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="credit-from"
              className="text-xs font-medium text-muted-foreground"
            >
              시작일
            </label>
            <Input
              id="credit-from"
              type="date"
              name="from"
              value={fromInput}
              max={todayInput}
              onChange={(event) => {
                const nextFrom = event.target.value;
                const [from, to] = getValidDate(nextFrom, toInput, "from");
                setFromInput(from);
                setToInput(to);
              }}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="credit-to"
              className="text-xs font-medium text-muted-foreground"
            >
              종료일
            </label>
            <Input
              id="credit-to"
              type="date"
              name="to"
              value={toInput}
              max={todayInput}
              onChange={(event) => {
                const nextTo = event.target.value;
                const [from, to] = getValidDate(fromInput, nextTo, "to");
                setFromInput(from);
                setToInput(to);
              }}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">적용</Button>
            <Button variant="outline" asChild>
              <Link href="/credits/history">초기화</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
