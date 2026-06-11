import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CANDIDATE_APP_DASHBOARD,
  getCandidateDashboardPath,
  isAllowedAppPath,
  isCandidateRole,
  isDisabledAppPath,
} from "@/lib/candidate-only";

const publicPaths = new Set([
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/error",
]);

const apiPublicPaths = ["/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (isDisabledAppPath(pathname)) {
    return NextResponse.redirect(new URL(CANDIDATE_APP_DASHBOARD, request.url));
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

  if (!isCandidateRole(userRole)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "candidateOnly");
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowedAppPath(pathname)) {
    const dashboard = getCandidateDashboardPath(userRole);
    return NextResponse.redirect(
      new URL(dashboard ?? CANDIDATE_APP_DASHBOARD, request.url)
    );
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
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
