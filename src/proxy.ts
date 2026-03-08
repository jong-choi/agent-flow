import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

const PUBLIC_PATHS = ["/", "/login"];
const intlMiddleware = createMiddleware(routing);

// intl rewrite URL에서 locale prefix를 제거한 경로를 반환
const stripLocalePrefix = (pathname: string): string => {
  const [, , ...rest] = pathname.split("/");
  return "/" + rest.join("/");
};

// 오픈 리다이렉트 공격 방지 함수
const getSafeCallbackUrl = (
  callbackUrl: string | null,
  origin: string,
): URL | null => {
  // 상대 경로가 아니거나 protocol-relative URL이면 차단
  if (!callbackUrl?.startsWith("/") || callbackUrl.startsWith("//")) {
    return null;
  }

  const target = new URL(callbackUrl, origin);
  const normalizedCallbackPath = stripLocalePrefix(target.pathname);

  // 로그인 루프 방지 및 URL 파서 우회 공격 차단
  if (normalizedCallbackPath === "/login" || target.origin !== origin) {
    return null;
  }

  return target;
};

export const proxy = auth((req) => {
  // 프록시 처리가 완료된 요청인지 확인 후 즉시 이동
  if (req.headers.get("x-next-intl-locale")) {
    return NextResponse.next();
  }

  const { pathname, search, origin } = req.nextUrl;
  const intlResponse = intlMiddleware(req);

  const rewriteUrl = intlResponse.headers.get("x-middleware-rewrite"); // localePrefix를 붙인 주소
  const normalizedPath = rewriteUrl
    ? stripLocalePrefix(new URL(rewriteUrl).pathname)
    : pathname;

  const isAuthenticated = !!req.auth?.user;
  const isPublicPath = PUBLIC_PATHS.includes(normalizedPath);

  // 미인증 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated && !isPublicPath) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  // 인증된 사용자가 로그인 페이지 접근 시 callbackUrl을 검증 후 리다이렉트
  if (isAuthenticated && normalizedPath === "/login") {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const safeTarget = getSafeCallbackUrl(callbackUrl, origin);
    if (safeTarget) return NextResponse.redirect(safeTarget);

    // callbackUrl 검증 실패시 홈화면으로 이동
    return NextResponse.redirect(new URL("/", req.url));
  }

  return intlResponse;
});

// 주소에 .이 있는 경우 무시됨
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
