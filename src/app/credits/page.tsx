import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db/client";
import { getCreditSummary } from "@/db/query/credit";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

type CreditTransactionType = "earn" | "spend";
type CreditTransactionCategory =
  | "attendance"
  | "workflow"
  | "preset_sale"
  | "preset_purchase"
  | "manual_adjustment";

type TransactionTypeMeta = {
  label: string;
  badgeClass: string;
  amountClass: string;
};

const TRANSACTION_TYPE_META: Record<CreditTransactionType, TransactionTypeMeta> = {
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
};

const TRANSACTION_CATEGORY_LABELS: Record<CreditTransactionCategory, string> = {
  attendance: "출석",
  workflow: "워크플로우",
  preset_sale: "프리셋 판매",
  preset_purchase: "프리셋 구매",
  manual_adjustment: "수동 조정",
};

const formatAmount = (amount: number) =>
  `${amount > 0 ? "+" : ""}${amount.toLocaleString()}`;

const formatDate = (value: string) =>
  format(new Date(value), "yyyy.MM.dd", { locale: ko });

export default async function CreditsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const summary = await getCreditSummary(user.id);

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
    {
      label: "총 획득",
      value: summary.totalEarned.toLocaleString(),
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">크레딧</h1>
        <p className="text-muted-foreground">
          크레딧으로 프리셋을 구매하고 워크플로우를 실행하세요
        </p>
      </div>
      <Card className="mb-8 border-2">
        <CardHeader>
        <CardTitle className="text-lg">현재 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-5xl font-bold">
              {summary.balance.toLocaleString()}
            </div>
            <div className="text-2xl text-muted-foreground">크레딧</div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {CREDIT_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-3">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">크레딧 획득하기</CardTitle>
          <CardDescription>다양한 방법으로 크레딧을 획득하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50">
            <div>
              <div className="font-medium">출석 체크</div>
              <div className="text-sm text-muted-foreground">
                매일 100 크레딧 획득
              </div>
            </div>
            <Link href="/credits/attendance">
              <Button>체크하기</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50">
            <div>
              <div className="font-medium">프리셋 판매</div>
              <div className="text-sm text-muted-foreground">
                나만의 프리셋을 판매하세요
              </div>
            </div>
            <Link href="/presets">
              <Button variant="outline">프리셋 보기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">최근 거래 내역</CardTitle>
            <Link href="/credits/history">
              <Button variant="ghost" size="sm">
                전체 보기
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {summary.recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              최근 거래 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction) => {
                const typeMeta = TRANSACTION_TYPE_META[transaction.type];
                return (
                  <div
                    key={transaction.id}
                    className="rounded-lg border p-4"
                  >
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
                            {
                              TRANSACTION_CATEGORY_LABELS[
                                transaction.category
                              ]
                            }
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
                          {formatDate(transaction.occurredAt)}
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
