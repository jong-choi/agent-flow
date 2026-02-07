import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  PageContainer,
  PageContentTitle,
  PageDescription,
  PageHeader,
  PageHeading,
  PageSectionTitle,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionItem } from "@/features/credits/components/transaction-item";
import {
  type CreditAttendanceStatus,
  type CreditSummary,
  getCreditSummary,
  getDailyAttendanceStatus,
} from "@/features/credits/server/queries";

export default function CreditsPage() {
  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>크레딧</PageHeading>
          <PageDescription>
            출석체크 이벤트를 통해 크레딧을 수집할 수 있습니다.
          </PageDescription>
          <PageDescription>
            크레딧은 프리셋을 구매하거나 워크플로우를 실행할 때 사용됩니다.
          </PageDescription>
        </PageHeader>
        <Suspense fallback={<CreditsSummaryFallback />}>
          <CreditsSummaryContent />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

async function CreditsSummaryContent() {
  const [summary, attendanceStatus] = await Promise.all([
    getCreditSummary(),
    getDailyAttendanceStatus(),
  ]);

  return (
    <CreditsSummaryView summary={summary} attendanceStatus={attendanceStatus} />
  );
}

function CreditsSummaryView({
  summary,
  attendanceStatus,
}: {
  summary: CreditSummary;
  attendanceStatus: CreditAttendanceStatus;
}) {
  const CREDIT_STATS = [
    {
      label: "이번 달 획득",
      value: `+${summary.monthlyEarned.toLocaleString()}`,
      color: "text-chart-2",
    },
    {
      label: "이번 달 사용",
      value: `-${summary.monthlySpent.toLocaleString()}`,
      color: "text-chart-1",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <PageContentTitle>크레딧 잔액</PageContentTitle>
          <div className="text-4xl font-extralight tracking-tighter">
            {summary.balance.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CREDIT_STATS.map((stat) => (
            <div key={stat.value}>
              <PageContentTitle className="text-sm">
                {stat.label}
              </PageContentTitle>
              <div className="flex items-center gap-2">
                <div
                  className={`text-2xl font-extralight tracking-tighter ${stat.color}`}
                >
                  {stat.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="py-0 shadow-none">
        <div className="flex items-center justify-between rounded-lg p-4 transition-colors">
          <div>
            <div className="font-medium">출석 체크</div>
            <div className="text-sm text-muted-foreground">
              매일 {attendanceStatus.dailyReward.toLocaleString()} 크레딧 획득
            </div>
          </div>
          {attendanceStatus.hasCheckedToday ? (
            <Button disabled variant="secondary">
              출석 완료
            </Button>
          ) : (
            <Link href="/credits/attendance">
              <Button className="cursor-pointer">출석하러 가기</Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between">
            <PageSectionTitle>최근 거래 내역</PageSectionTitle>
            <Link href="/credits/history">
              <Button variant="ghost" size="sm">
                전체 보기
                <ChevronRight />
              </Button>
            </Link>
          </div>
        </div>
        <div>
          {summary.recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              최근 거래 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction) => {
                return (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CreditsSummaryFallback() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <PageContentTitle>크레딧 잔액</PageContentTitle>
          <Skeleton className="mt-2 h-11 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {["이번 달 획득", "이번 달 사용"].map((label) => (
            <div key={label}>
              <PageContentTitle className="text-sm">{label}</PageContentTitle>
              <Skeleton className="mt-2 h-8 w-28" />
            </div>
          ))}
        </div>
      </div>
      <Card className="py-0 shadow-none">
        <div className="flex items-center justify-between rounded-lg p-4 transition-colors">
          <div>
            <div className="font-medium">출석 체크</div>
            <Skeleton className="mt-2 h-4 w-44" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageSectionTitle>최근 거래 내역</PageSectionTitle>
          <Link href="/credits/history">
            <Button variant="ghost" size="sm">
              전체 보기
              <ChevronRight />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
