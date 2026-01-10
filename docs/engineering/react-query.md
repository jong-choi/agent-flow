## useSuspenseQuery와 hydration 이슈

```tsx
export function SiteHeader() {
  return (
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <AccountMenu />
        </Suspense>
  );
}
```

```tsx
"use client";

import { getSession } from "next-auth/react";

export function AccountMenu() {
  const { data: session } = useSuspenseQuery({
    queryKey: ["session"],
    queryFn: async () => getSession(),
  });

  return ...
}
```

위와 같이 suspenseQuery를 사용하는 경우 하이드레이션 이슈가 발생할 수 있다.

[https://velog.io/@windowook/React-Query-Next.js-useSuspenseQuery-Hydration-Error](https://velog.io/@windowook/React-Query-Next.js-useSuspenseQuery-Hydration-Error)

```tsx
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["session"],
    queryFn: async () => await auth(),
  });

  return (
          <AppProvider>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <main className="flex h-screen flex-col">
                <SiteHeader />
                {children}
              </main>
              <Toaster position="top-right" richColors />
            </HydrationBoundary>
          </AppProvider>
  );
}
```

prefetch와 HydrationBoundary 를 이용하여 초기값을 설정해주는 방식으로 해결할 수 있다.

(위 예시에서 await auth는 header를 읽기 때문에 페이지가 강제로 SSR이 된다. Next/auth 내의 SessionProvider 를 이용하도록 변경하였다.)

Error Boundary에서 Next.js를 쓸 때에
Next.js의 NEXT_REDIRECT를 에러 바운더리가 감지하는 경우가 있다.

이 경우 아래와 같이`import { isRedirectError } from "next/dist/client/components/redirect-error";` 로 감지할 수 있다.

```tsx
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

export function MainErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  if (isRedirectError(error)) {
    // NEXT_REDIRECT는 바이패스로 내보내기
    throw error;
  }

  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center"
      role="alert"
    >
      <div className="flex gap-4">
        <Button variant="default" className="mt-4" onClick={resetErrorBoundary}>
          재시도
        </Button>
    </div>
  );
}
```
