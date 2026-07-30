import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const STAFF_ROLES = ["ADMIN", "CASHIER", "DELIVERY"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const user = req.auth?.user;
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (
    (pathname.startsWith("/account") || pathname.startsWith("/orders")) &&
    !req.auth?.user
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/orders/:path*"],
};
