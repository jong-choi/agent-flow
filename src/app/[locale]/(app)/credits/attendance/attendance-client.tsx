"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Gift,
  Square,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

const MILESTONE_REWARDS = [
  { days: 7, reward: 500, description: "7일 연속 출석" },
  { days: 14, reward: 1000, description: "14일 연속 출석" },
  { days: 30, reward: 3000, description: "30일 연속 출석" },
];

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
      const data = await response.json();

      if (!response.ok) {
        console.error("출석 체크 실패:", data?.error ?? data);
        if (response.status === 409 && data?.attendance) {
          setAttendance(data.attendance as AttendanceSummary);
        }
        return;
      }

      setAttendance(data.attendance as AttendanceSummary);

      if (data.credited) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
    } catch (error) {
      console.error("출석 체크 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const milestoneRewards = MILESTONE_REWARDS.map((milestone) => ({
    ...milestone,
    achieved: attendance.bestStreak >= milestone.days,
  }));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link href="/credits">
          <Button variant="ghost" size="sm" className="mb-2">
            ← 돌아가기
          </Button>
        </Link>
        <h1 className="mb-2 text-3xl font-bold">출석 체크</h1>
        <p className="text-muted-foreground">
          매일 출석하고 크레딧을 획득하세요
        </p>
      </div>
      <Card className="mb-8 border-2">
        <CardContent className="pt-6">
          <div className="text-center">
            {!attendance.hasCheckedToday ? (
              <>
                <CalendarCheck className="mx-auto mb-4 h-16 w-16 text-primary" />
                <h2 className="mb-2 text-2xl font-bold">오늘의 출석</h2>
                <p className="mb-6 text-muted-foreground">
                  출석 체크하고 {attendance.dailyReward.toLocaleString()} 크레딧을
                  받으세요
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
                  {attendance.dailyReward.toLocaleString()} 크레딧을 획득했습니다
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
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>현재 연속</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attendance.currentStreak}일
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>최고 연속</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">
              {attendance.bestStreak}일
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 출석</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2">
              {attendance.totalAttendance}일
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">이번 주 출석 현황</CardTitle>
          <CardDescription>
            연속으로 출석하면 보너스 크레딧을 받을 수 있어요
          </CardDescription>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">마일스톤 보상</CardTitle>
          <CardDescription>
            연속 출석 목표를 달성하면 특별 보상을 획득합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestoneRewards.map((milestone) => (
              <div
                key={milestone.days}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  milestone.achieved
                    ? "border-primary bg-primary/5"
                    : "border-border"
                } `}
              >
                <div className="flex items-center gap-4">
                  <div>
                    {milestone.achieved ? (
                      <Gift className="h-8 w-8 text-chart-2" />
                    ) : (
                      <Target className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{milestone.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.achieved
                        ? "달성 완료!"
                        : `${attendance.currentStreak} / ${milestone.days}일`}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={milestone.achieved ? "default" : "secondary"}
                  className="px-3 py-1 text-base"
                >
                  +{milestone.reward.toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
