import { format } from "date-fns";
import { TransactionItem } from "@/app/[locale]/(app)/credits/_components/transaction-item";
import {
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type TransactionResult, getCreditHistory } from "@/db/query/credit";
import { auth } from "@/lib/auth";

export default async function CreditsHistoryPage(
  props: PageProps<"/[locale]/credits/history">,
) {
  return (
    <PageStack>
      <PageHeader>
        <PageHeading>크레딧 내역</PageHeading>
        <PageDescription>최대 조회 가능 기간은 6개월입니다.</PageDescription>
      </PageHeader>
      <CreditHistory {...props} />
    </PageStack>
  );
}

export async function CreditHistory({
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const awaitedSearchParams = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("사용자 정보를 불러올 수 없습니다.");
  }

  const type = awaitedSearchParams?.type;

  const { transactions, range } = await getCreditHistory(
    userId,
    awaitedSearchParams,
  );

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
