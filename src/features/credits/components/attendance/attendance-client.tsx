"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { type AttendanceResult } from "@/app/api/credits/attendance/route";
import { PageStack } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateCreditTagsAction } from "@/features/credits/server/actions";
import { parseApiErrorPayload } from "@/lib/errors/api-client-error";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type WeeklyAttendanceItem = {
  day: string;
  date: string;
  checked: boolean;
  reward: number;
  isToday: boolean;
};

type AttendanceSummary = {
  hasCheckedToday: boolean;
  weeklyAttendance: WeeklyAttendanceItem[];
  currentStreak: number;
  bestStreak: number;
  totalAttendance: number;
  dailyReward: number;
};

type AttendanceClientProps = {
  summary: AttendanceSummary;
};

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function AttendanceClient({ summary }: AttendanceClientProps) {
  const t = useTranslations<AppMessageKeys>("Credits");
  const [attendance, setAttendance] = useState<AttendanceSummary>(summary);
  const [showReward, setShowReward] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckIn = async () => {
    if (attendance.hasCheckedToday || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/credits/attendance", {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const parsedError = parseApiErrorPayload(data);
        if (parsedError?.code === "invalid_request") {
          const parsed = JSON.parse(parsedError.message) as {
            reason?: string;
            attendance: AttendanceSummary;
            balance?: number;
          };
          if (parsed.reason === "already_claimed") {
            setAttendance(parsed.attendance);
            void updateCreditTagsAction({ includeAttendance: true });
            return;
          }
        }
        throw new Error(t("attendance.checkInFailed"));
      }

      const result = data as AttendanceResult;
      setAttendance(result.attendance);

      if (result.credited) {
        void updateCreditTagsAction({ includeAttendance: true });
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
    } catch {
      toast.error(t("attendance.checkInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageStack>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            {!attendance.hasCheckedToday ? (
              <>
                <CalendarCheck className="mx-auto mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 text-2xl font-bold">
                  {t("attendance.todayTitle")}
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {t("attendance.todayDescription", {
                    count: attendance.dailyReward.toLocaleString(),
                  })}
                </p>
                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  className="px-8 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t("attendance.processing")
                    : t("attendance.checkIn")}
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-chart-2" />
                <h2 className="mb-2 text-2xl font-bold">
                  {t("attendance.completedTitle")}
                </h2>
                <p className="mb-4 text-muted-foreground">
                  {t("attendance.completedDescription", {
                    count: attendance.dailyReward.toLocaleString(),
                  })}
                </p>
                {showReward && (
                  <div className="animate-bounce text-4xl font-bold text-chart-2">
                    +{attendance.dailyReward.toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t("attendance.currentStreak")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {t("attendance.dayCount", { count: attendance.currentStreak })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("attendance.bestStreak")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              {t("attendance.dayCount", { count: attendance.bestStreak })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("attendance.totalAttendance")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">
              {t("attendance.dayCount", {
                count: attendance.totalAttendance,
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("attendance.weeklyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {attendance.weeklyAttendance.map((day, index) => (
              <div
                key={day.date}
                className={`rounded-lg border-2 p-4 text-center transition-colors ${
                  day.checked
                    ? "border-primary bg-primary/10"
                    : day.isToday
                      ? "border-accent bg-accent"
                      : "border-border"
                } `}
              >
                <div className="mb-1 font-bold">
                  {t(`attendance.weeklyDays.${WEEKDAY_KEYS[index]}`)}
                </div>
                <div className="mb-2 text-xs text-muted-foreground">
                  {day.date}
                </div>
                <div className="flex justify-center">
                  {day.checked ? (
                    <CheckCircle2 className="h-8 w-8 text-chart-2" />
                  ) : day.isToday ? (
                    <CalendarCheck className="h-8 w-8 text-primary" />
                  ) : (
                    <Square className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2 text-xs font-medium">
                  +{day.reward.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageStack>
  );
}
