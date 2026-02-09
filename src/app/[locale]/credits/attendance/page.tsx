import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceClient } from "@/features/credits/components/attendance/attendance-client";
import { getCreditAttendanceSummary } from "@/features/credits/server/queries";

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendancePageFallback />}>
      <AttendancePageContent />
    </Suspense>
  );
}

async function AttendancePageContent() {
  const summary = await getCreditAttendanceSummary();

  return <AttendanceClient summary={summary} />;
}

function AttendancePageFallback() {
  return (
    <PageContainer>
      <PageStack>
        <PageHeader>
          <PageHeading>출석 체크</PageHeading>
          <div className="text-sm text-muted-foreground">
            <Skeleton className="h-4 w-56" />
          </div>
        </PageHeader>
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
    </PageContainer>
  );
}
