import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/error",
]);

const apiPublicPaths = ["/api/auth"];

const rolePathMap: Record<string, readonly string[]> = {
  "/candidate": ["CANDIDATE"],
  "/recruiter": ["RECRUITER", "AGENCY_ADMIN"],
  "/hiring-manager": ["HIRING_MANAGER", "AGENCY_ADMIN"],
  "/admin": ["AGENCY_ADMIN"],
  "/platform": ["PLATFORM_ADMIN"],
};

function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "CANDIDATE":
      return "/candidate/dashboard";
    case "RECRUITER":
      return "/recruiter/dashboard";
    case "HIRING_MANAGER":
      return "/hiring-manager/dashboard";
    case "AGENCY_ADMIN":
      return "/admin/dashboard";
    case "PLATFORM_ADMIN":
      return "/platform/dashboard";
    default:
      return "/";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = typeof token.role === "string" ? token.role : undefined;

  if (userRole) {
    for (const [pathPrefix, allowedRoles] of Object.entries(rolePathMap)) {
      if (pathname.startsWith(pathPrefix)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(
            new URL(getRoleDashboardPath(userRole), request.url)
          );
        }
        break;
      }
    }
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and static files from /public (served at root, e.g. /brand/...).
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
