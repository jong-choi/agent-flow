import { type ReactNode, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditHistoryFilter } from "@/features/credits/components/history/history-filter";

type CreditsHistoryLayoutProps = {
  children: ReactNode;
};

export default function CreditsHistoryLayout({
  children,
}: CreditsHistoryLayoutProps) {
  return (
    <>
      {children}
      <aside className="fixed top-20 right-10 w-full shrink-0 lg:w-72">
        <Suspense fallback={<CreditHistoryFilterFallback />}>
          <CreditHistoryFilter />
        </Suspense>
      </aside>
    </>
  );
}

function CreditHistoryFilterFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <Skeleton className="h-6 w-14" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex items-end gap-2">
          <Skeleton className="h-9 w-14" />
          <Skeleton className="h-9 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}
