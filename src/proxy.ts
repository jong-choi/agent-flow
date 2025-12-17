import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  // 로그인된 사용자가 로그인 페이지에 접속 시
  if (req.nextUrl.pathname === "/login" && req.auth?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login"],
};
