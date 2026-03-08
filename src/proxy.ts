import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

const publicPaths = ["/", "/login"];
const intlMiddleware = createMiddleware(routing);
const localePrefixMode =
  typeof routing.localePrefix === "object"
    ? routing.localePrefix.mode
    : (routing.localePrefix ?? "always");

const getPathInfo = (pathname: string) => {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) {
      return { locale, pathname: "/" };
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return { locale, pathname: pathname.slice(prefix.length) };
    }
  }

  return { locale: null, pathname };
};

const getSafeUrl = (value: string | null, origin: string) => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, origin);
    return url.origin === origin ? url : null;
  } catch {
    return null;
  }
};

const buildLocalizedPathname = (pathname: string, locale: string) => {
  if (localePrefixMode === "never") {
    return pathname;
  }

  const shouldPrefix =
    localePrefixMode === "always" || locale !== routing.defaultLocale;

  if (!shouldPrefix) {
    return pathname;
  }

  if (pathname === "/") {
    return `/${locale}`;
  }

  return `/${locale}${pathname}`;
};

const copyLocaleCookies = (source: NextResponse, target: NextResponse) => {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }

  return target;
};

export const proxy = auth((req) => {
  const intlResponse = intlMiddleware(req);
  const origin = req.nextUrl.origin;
  const rewrittenUrl = getSafeUrl(
    intlResponse.headers.get("x-middleware-rewrite"),
    origin,
  );
  const redirectedUrl = getSafeUrl(intlResponse.headers.get("location"), origin);
  const effectiveUrl = rewrittenUrl ?? redirectedUrl ?? new URL(req.url);
  const userFacingUrl = redirectedUrl ?? new URL(req.url);
  const pathInfo = getPathInfo(effectiveUrl.pathname);
  const normalizedPath = pathInfo.pathname;
  const resolvedLocale = pathInfo.locale ?? routing.defaultLocale;
  const isPublicPath = publicPaths.includes(normalizedPath);

  // 로그인되지 않은 사용자가 공개 경로가 아닌 곳에 접근 시
  if (!req.auth?.user && !isPublicPath) {
    const loginUrl = new URL(buildLocalizedPathname("/login", resolvedLocale), origin);
    const callbackUrl = `${userFacingUrl.pathname}${userFacingUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return copyLocaleCookies(intlResponse, NextResponse.redirect(loginUrl));
  }

  // 로그인된 사용자가 로그인 페이지에 접속 시
  if (normalizedPath === "/login" && req.auth?.user) {
    const callbackUrl = userFacingUrl.searchParams.get("callbackUrl");
    let normalizedCallbackPath: string | null = null;

    if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
      try {
        normalizedCallbackPath = getPathInfo(
          new URL(callbackUrl, origin).pathname,
        ).pathname;
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
        return copyLocaleCookies(intlResponse, NextResponse.redirect(targetUrl));
      }
    }

    const fallbackUrl = new URL(buildLocalizedPathname("/", resolvedLocale), origin);
    return copyLocaleCookies(intlResponse, NextResponse.redirect(fallbackUrl));
  }

  return intlResponse;
});

// 주소에 .이 있는 경우 무시됨
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
