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
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자가 로그인 페이지에 접속 시
  if (pathname === "/login" && req.auth?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
});

// 주소에 .이 있는 경우 무시됨
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
