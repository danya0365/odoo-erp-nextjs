// Next.js 16: "proxy" แทน middleware — optimistic auth gate เท่านั้น
// (เช็คแค่ "มี cookie ไหม"; authz จริงอยู่ใน layout/action ผ่าน requireRole)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "es_session";
const PROTECTED_PREFIXES = ["/admin", "/shop", "/staff"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname); // ให้ layout อ่าน path ได้ถ้าจำเป็น

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (needsAuth && !request.cookies.has(COOKIE_NAME)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/shop/:path*", "/staff/:path*"],
};
