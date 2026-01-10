"use client";

import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MainErrorFallback } from "@/components/errors/main";
import { queryConfig } from "@/lib/react-query";

export function AppProvider({ children }: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <QueryClientProvider client={queryClient}>
        {process.env.DEV && <ReactQueryDevtools />}
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
