"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";

type TypeFilter = "all" | "earn" | "spend";

const QUICK_RANGE_MONTHS = [1, 3, 6] as const;

const formatDateInput = (value: Date) => format(value, "yyyy-MM-dd");

export function CreditHistoryFilter() {
  const t = useTranslations<AppMessageKeys>("Credits");
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "all";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const typeOptions = [
    { label: t("history.typeAll"), value: "all" },
    { label: t("history.typeEarn"), value: "earn" },
    { label: t("history.typeSpend"), value: "spend" },
  ] as const;

  const [selectedType, setSelectedType] = useState<TypeFilter>(
    type as TypeFilter,
  );
  const [fromInput, setFromInput] = useState<string>(from as string);
  const [toInput, setToInput] = useState<string>(to as string);

  const todayInput = formatDateInput(new Date());
  const today = new Date();

  const quickRanges = QUICK_RANGE_MONTHS.map((months) => {
    const quickTo = today;
    const quickFrom = subMonths(quickTo, months);
    const quickFromInput = formatDateInput(quickFrom);
    const quickToInput = formatDateInput(quickTo);

    const label =
      months === 1
        ? t("history.filter.recent1Month")
        : months === 3
          ? t("history.filter.recent3Months")
          : t("history.filter.recent6Months");

    return {
      label,
      months,
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
        <CardTitle className="text-lg">{t("history.filter.title")}</CardTitle>
        <CardDescription>{t("history.filter.description")}</CardDescription>
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
              {t("history.filter.typeLabel")}
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
              {typeOptions.map((option) => (
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
              {t("history.filter.fromLabel")}
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
              {t("history.filter.toLabel")}
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
            <Button type="submit">{t("history.filter.apply")}</Button>
            <Button variant="outline" asChild>
              <Link href="/credits/history">{t("history.filter.reset")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
