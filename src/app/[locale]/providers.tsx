"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MainErrorFallback } from "@/components/errors/main";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { queryConfig } from "@/lib/react-query";

export function AppProvider({ children }: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {process.env.DEV && <ReactQueryDevtools />}
            {children}
          </QueryClientProvider>
        </SessionProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
