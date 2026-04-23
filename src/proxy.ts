import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const authRoutes = ["/signin", "/signup"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const isAdmin = (req.auth?.user as unknown as { role: string })?.role === 'ADMIN';

  // Check Maintenance Mode (except for static assets or the maintenance page itself)
  if (!isAdmin && pathname !== '/maintenance' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    try {
      // Use absolute URL pointing to our API
      const res = await fetch(new URL('/api/settings', req.url), {
        next: { revalidate: 60 }
      });
      if (res.ok) {
        const config = await res.json();
        if (config.maintenanceMode) {
          return NextResponse.redirect(new URL('/maintenance', req.url));
        }
      }
    } catch (e) {
      console.error('Failed to check maintenance mode in proxy:', e);
    }
  }

  // Public routes — always accessible regardless of auth
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }
  if (pathname === "/gallery" || (pathname.startsWith("/gallery") && !pathname.startsWith("/gallery/user"))) {  
    return NextResponse.next();
  }
  if (pathname.startsWith("/p/") || pathname === "/p") {
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
