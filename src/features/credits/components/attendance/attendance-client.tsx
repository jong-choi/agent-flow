"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, Square } from "lucide-react";
import { type AttendanceResult } from "@/app/api/credits/attendance/route";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateCreditTagsAction } from "@/features/credits/server/actions";

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

export function AttendanceClient({ summary }: AttendanceClientProps) {
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
      const data: AttendanceResult = await response.json();

      if (!response.ok) {
        throw new Error("출석체크에 실패하였습니다.");
      }

      setAttendance(data.attendance);

      if (data.credited) {
        void updateCreditTagsAction({ includeAttendance: true });
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>출석 체크</PageHeading>
          <PageDescription>
            매일 체크인하고 100크레딧을 받으세요
          </PageDescription>
        </PageHeader>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {!attendance.hasCheckedToday ? (
                <>
                  <CalendarCheck className="mx-auto mb-4 h-16 w-16 text-primary" />
                  <h2 className="mb-2 text-2xl font-bold">오늘의 출석</h2>
                  <p className="mb-6 text-muted-foreground">
                    출석 체크하고 {attendance.dailyReward.toLocaleString()}{" "}
                    크레딧을 받으세요
                  </p>
                  <Button
                    size="lg"
                    onClick={handleCheckIn}
                    className="px-8 text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "처리 중..." : "출석 체크하기"}
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-chart-2" />
                  <h2 className="mb-2 text-2xl font-bold">출석 완료!</h2>
                  <p className="mb-4 text-muted-foreground">
                    {attendance.dailyReward.toLocaleString()} 크레딧을
                    획득했습니다
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
              <CardDescription>현재 연속</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {attendance.currentStreak}일
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>최고 연속</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">
                {attendance.bestStreak}일
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>총 출석</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">
                {attendance.totalAttendance}일
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이번 주 출석 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {attendance.weeklyAttendance.map((day) => (
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
                  <div className="mb-1 font-bold">{day.day}</div>
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
    </PageContainer>
  );
}
