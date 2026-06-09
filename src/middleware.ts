import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getRoleDashboardPath } from "@/lib/rbac/permissions";
import {
  checkRateLimit,
  getRateLimitKey,
} from "@/lib/security/rate-limit";

const publicPaths = ["/", "/auth/login", "/auth/register", "/auth/error"];
const apiPublicPaths = ["/api/auth"];

const rolePathMap: Record<string, UserRole[]> = {
  "/candidate": [UserRole.CANDIDATE],
  "/recruiter": [UserRole.RECRUITER, UserRole.AGENCY_ADMIN],
  "/hiring-manager": [UserRole.HIRING_MANAGER, UserRole.AGENCY_ADMIN],
  "/admin": [UserRole.AGENCY_ADMIN],
  "/platform": [UserRole.PLATFORM_ADMIN],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/") && !apiPublicPaths.some((p) => pathname.startsWith(p))) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const key = getRateLimitKey(ip, pathname);
    const { allowed, remaining, resetAt } = checkRateLimit(key);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetAt.toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetAt.toString());
  }

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow auth API
  if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await auth();

  // Redirect unauthenticated users
  if (!session?.user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user.role;

  // Check role-based access
  for (const [pathPrefix, allowedRoles] of Object.entries(rolePathMap)) {
    if (pathname.startsWith(pathPrefix)) {
      if (!allowedRoles.includes(userRole)) {
        const dashboard = getRoleDashboardPath(userRole);
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
      break;
    }
  }

  // CSRF protection for mutations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
