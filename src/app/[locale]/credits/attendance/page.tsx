import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FadeSuspense } from "@/components/ui/fade-suspense";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceClient } from "@/features/credits/components/attendance/attendance-client";
import { getCreditAttendanceSummary } from "@/features/credits/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

const DAILY_ATTENDANCE_REWARD = 100;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/credits/attendance">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return {
    title: t("meta.attendanceTitle"),
  };
}

export default async function AttendancePage({
  params,
}: PageProps<"/[locale]/credits/attendance">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Credits",
  });

  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>{t("attendance.heading")}</PageHeading>
          <PageDescription>
            {t("attendance.description", {
              count: new Intl.NumberFormat(locale).format(
                DAILY_ATTENDANCE_REWARD,
              ),
            })}
          </PageDescription>
        </PageHeader>
        <FadeSuspense fallback={<AttendancePageFallback />}>
          <AttendancePageContent />
        </FadeSuspense>
      </PageStack>
    </PageContainer>
  );
}

async function AttendancePageContent() {
  const summary = await getCreditAttendanceSummary();

  return <AttendanceClient summary={summary} />;
}

function AttendancePageFallback() {
  return (
    <PageStack>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-8 w-40" />
            <Skeleton className="mx-auto h-4 w-52" />
            <Skeleton className="mx-auto h-11 w-36" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </PageStack>
  );
}
