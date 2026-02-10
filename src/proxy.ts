import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

const publicPaths = ["/", "/login"];
const intlMiddleware = createMiddleware(routing);

const hasLocalePrefix = (pathname: string) => {
  return routing.locales.some((locale) => {
    const prefix = `/${locale}`;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
};

const normalizePath = (pathname: string) => {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) {
      return "/";
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length);
    }
  }
  return pathname;
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const normalizedPath = normalizePath(pathname);
  const isPublicPath = publicPaths.includes(normalizedPath);

  // 로그인되지 않은 사용자가 공개 경로가 아닌 곳에 접근 시
  if (!req.auth?.user && !isPublicPath) {
    const url = req.nextUrl.clone();
    const callbackUrl = `${pathname}${req.nextUrl.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자가 로그인 페이지에 접속 시
  if (normalizedPath === "/login" && req.auth?.user) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const origin = req.nextUrl.origin;
    let normalizedCallbackPath: string | null = null;
    if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
      try {
        normalizedCallbackPath = normalizePath(
          new URL(callbackUrl, origin).pathname,
        );
      } catch {
        normalizedCallbackPath = null;
      }
    }
    if (
      callbackUrl?.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      normalizedCallbackPath !== "/login"
    ) {
      const targetUrl = new URL(callbackUrl, origin);
      if (targetUrl.origin === origin) {
        return NextResponse.redirect(targetUrl);
      }
    }

    const fallbackUrl = req.nextUrl.clone();
    fallbackUrl.pathname = "/";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl);
  }

  // localePrefix: "never" 모드에서는 / 요청이 내부적으로 /{locale}로 rewrite 된다.
  // rewrite 된 내부 경로에서 미들웨어가 다시 실행되면 intlMiddleware 재호출로 루프가 생길 수 있다.
  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  const response = intlMiddleware(req);

  // Reverse proxy 환경에서 x-middleware-rewrite가 절대 URL이면
  // Next 런타임이 외부 프록시 요청으로 처리할 수 있다.
  // 내부 locale rewrite는 path-only 형식으로 강제해 재프록시/루프를 방지한다.
  const rewriteHeader = response.headers.get("x-middleware-rewrite");
  if (rewriteHeader) {
    try {
      const rewriteUrl = new URL(rewriteHeader);
      const normalizedPath =
        `${rewriteUrl.pathname}${rewriteUrl.search}` || "/";
      response.headers.set("x-middleware-rewrite", normalizedPath);
    } catch {
      // Keep relative rewrite value as-is.
    }
  }

  return response;
});

// 주소에 .이 있는 경우 무시됨
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
