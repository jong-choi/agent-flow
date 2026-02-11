import { Suspense } from "react";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditHistoryFilter } from "@/features/credits/components/history/history-filter";
import { TransactionItem } from "@/features/credits/components/transaction-item";
import {
  type TransactionResult,
  getCreditHistory,
} from "@/features/credits/server/queries";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/credits/history">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);

  return {
    title: locale === "ko" ? "크레딧 내역" : "Credit History",
  };
}

export default async function CreditsHistoryPage(
  props: PageProps<"/[locale]/credits/history">,
) {
  return (
    <PageContainer
      RightPanel={
        <Suspense>
          <CreditHistoryFilter />
        </Suspense>
      }
    >
      <PageStack>
        <PageHeader>
          <PageHeading>크레딧 내역</PageHeading>
          <PageDescription>최대 조회 가능 기간은 6개월입니다.</PageDescription>
        </PageHeader>
        <Suspense fallback={<CreditHistoryFallback />}>
          <CreditHistory {...props} />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

export async function CreditHistory({
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const awaitedSearchParams = await searchParams;

  const type = awaitedSearchParams?.type;

  const { transactions, range } = await getCreditHistory(awaitedSearchParams);

  const rangeLabel = `${format(range.from, "yy.MM.dd")} ~ ${format(
    range.to,
    "yy.MM.dd",
  )}`;

  const TYPE_OPTIONS = [
    { label: "전체", value: "all" },
    { label: "획득", value: "earn" },
    { label: "사용", value: "spend" },
  ] as const;

  const typeLabel =
    TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "전체";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">유형: {typeLabel}</Badge>
        <Badge variant="outline">기간: {rangeLabel}</Badge>
        <Badge variant="secondary">총 {transactions.length}건</Badge>
        <Badge variant="secondary">
          누계{" "}
          {transactions
            .map((transaction) => transaction.amount)
            .reduce((a, b) => a + b, 0)}
          크레딧
        </Badge>
      </div>
      <List transactions={transactions} />
    </div>
  );
}

function List({ transactions }: { transactions: TransactionResult[] }) {
  return (
    <Card>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            해당하는 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreditHistoryFallback() {
  return (
    <Card className="border-border/60">
      <CardContent>
        <div className="space-y-6 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
