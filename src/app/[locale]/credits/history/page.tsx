import { Suspense } from "react";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/credits/history">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return {
    title: t("meta.historyTitle"),
  };
}

export default async function CreditsHistoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

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
          <PageHeading>{t("history.heading")}</PageHeading>
          <PageDescription>{t("history.description")}</PageDescription>
        </PageHeader>
        <Suspense fallback={<CreditHistoryFallback />}>
          <CreditHistory params={params} searchParams={searchParams} />
        </Suspense>
      </PageStack>
    </PageContainer>
  );
}

export async function CreditHistory({
  params,
  searchParams,
}: PageProps<"/[locale]/credits/history">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });
  const awaitedSearchParams = await searchParams;

  const type = awaitedSearchParams?.type;

  const { transactions, range } = await getCreditHistory(awaitedSearchParams);

  const rangeLabel = `${format(range.from, "yy.MM.dd")} ~ ${format(
    range.to,
    "yy.MM.dd",
  )}`;

  const typeOptions = [
    { label: t("history.typeAll"), value: "all" },
    { label: t("history.typeEarn"), value: "earn" },
    { label: t("history.typeSpend"), value: "spend" },
  ] as const;

  const typeLabel =
    typeOptions.find((option) => option.value === type)?.label ??
    t("history.typeAll");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {t("history.badges.type", { value: typeLabel })}
        </Badge>
        <Badge variant="outline">
          {t("history.badges.period", { value: rangeLabel })}
        </Badge>
        <Badge variant="secondary">
          {t("history.badges.totalCount", {
            count: transactions.length.toLocaleString(),
          })}
        </Badge>
        <Badge variant="secondary">
          {t("history.badges.totalAmount", {
            amount: transactions
              .map((transaction) => transaction.amount)
              .reduce((a, b) => a + b, 0)
              .toLocaleString(),
          })}
        </Badge>
      </div>
      <List transactions={transactions} locale={locale} />
    </div>
  );
}

async function List({
  transactions,
  locale,
}: {
  transactions: TransactionResult[];
  locale: string;
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return (
    <Card>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {t("history.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                typeLabels={{
                  earn: t("transaction.earn"),
                  spend: t("transaction.spend"),
                }}
              />
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
