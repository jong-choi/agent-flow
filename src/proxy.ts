import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

const publicPaths = ["/", "/login"];
const intlMiddleware = createMiddleware(routing);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPath = publicPaths.includes(pathname);

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
  if (pathname === "/login" && req.auth?.user) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const origin = req.nextUrl.origin;
    if (
      callbackUrl?.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("/login")
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

  return intlMiddleware(req);
});

// 주소에 .이 있는 경우 무시됨
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
