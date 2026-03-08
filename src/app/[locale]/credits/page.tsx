import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
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
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionItem } from "@/features/credits/components/transaction-item";
import {
  getCreditSummary,
  getDailyAttendanceStatus,
} from "@/features/credits/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/credits">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return {
    title: t("meta.creditsTitle"),
  };
}

export default async function CreditsPage({
  params,
}: PageProps<"/[locale]/credits">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>{t("page.heading")}</PageHeading>
          <PageDescription>{t("page.descriptionLine1")}</PageDescription>
          <PageDescription>{t("page.descriptionLine2")}</PageDescription>
        </PageHeader>
        <FadeSuspense fallback={<CreditsSummaryFallback />}>
          <CreditsSummaryContent locale={locale} />
        </FadeSuspense>
      </PageStack>
    </PageContainer>
  );
}

async function CreditsSummaryContent({ locale }: { locale: string }) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });
  const [summary, attendanceStatus] = await Promise.all([
    getCreditSummary(),
    getDailyAttendanceStatus(),
  ]);

  const creditStats = [
    {
      label: t("summary.monthlyEarned"),
      value: `+${summary.monthlyEarned.toLocaleString()}`,
      color: "text-chart-2",
    },
    {
      label: t("summary.monthlySpent"),
      value: `-${summary.monthlySpent.toLocaleString()}`,
      color: "text-chart-1",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <PageContentTitle>{t("summary.balance")}</PageContentTitle>
          <div className="text-4xl font-extralight tracking-tighter">
            {summary.balance.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {creditStats.map((stat) => (
            <div key={stat.label}>
              <PageContentTitle className="text-sm">
                {stat.label}
              </PageContentTitle>
              <div className="flex items-center gap-2">
                <div
                  className={`text-2xl font-extralight tracking-tighter ${stat.color}`}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="py-0 shadow-none">
        <div className="flex items-center justify-between rounded-lg p-4 transition-colors">
          <div>
            <div className="font-medium">{t("summary.attendanceTitle")}</div>
            <div className="text-sm text-muted-foreground">
              {t("summary.attendanceReward", {
                count: attendanceStatus.dailyReward.toLocaleString(),
              })}
            </div>
          </div>
          {attendanceStatus.hasCheckedToday ? (
            <Button disabled variant="secondary">
              {t("summary.attendanceDone")}
            </Button>
          ) : (
            <Link href="/credits/attendance">
              <Button className="cursor-pointer">
                {t("summary.goAttendance")}
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between">
            <PageSectionTitle>
              {t("summary.recentTransactions")}
            </PageSectionTitle>
            <Link href="/credits/history">
              <Button variant="ghost" size="sm">
                {t("summary.viewAll")}
                <ChevronRight />
              </Button>
            </Link>
          </div>
        </div>
        <div>
          {summary.recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("summary.noRecentTransactions")}
            </div>
          ) : (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction) => {
                return (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    typeLabels={{
                      earn: t("transaction.earn"),
                      spend: t("transaction.spend"),
                    }}
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
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-11 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-28" />
            </div>
          ))}
        </div>
      </div>
      <Card className="py-0 shadow-none">
        <div className="flex items-center justify-between rounded-lg p-4 transition-colors">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-20" />
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
