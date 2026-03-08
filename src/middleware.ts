import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const authRoutes = ["/signin", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public gallery — always accessible regardless of auth
  if (pathname === "/gallery" || (pathname.startsWith("/gallery") && !pathname.startsWith("/gallery/user"))) {
    return NextResponse.next();
  }

  // Auth pages — redirect authenticated users to dashboard
  if (authRoutes.includes(pathname) || pathname.startsWith("/api/auth")) {
    if (isAuthenticated && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/(?!auth)|_next/static|_next/image|favicon.ico|logo.png|filters|android-chrome|apple-touch|favicon|site.webmanifest).*)",
  ],
};
