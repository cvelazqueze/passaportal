import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/rbac/permissions";
import { db } from "@/lib/db";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export interface AuthContext {
  userId: string;
  role: UserRole;
  organizationId?: string;
  email: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await db.organizationMember.findUnique({
    where: { userId: session.user.id },
    select: { organizationId: true, role: true },
  });

  return {
    userId: session.user.id,
    role: member?.role ?? (session.user.role as UserRole),
    organizationId: member?.organizationId,
    email: session.user.email!,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new AuthorizationError("Authentication required");
  return ctx;
}

export async function requirePermission(
  permission: Permission
): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!hasPermission(ctx.role, permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }
  return ctx;
}

export async function requireRole(...roles: UserRole[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.role)) {
    throw new AuthorizationError("Insufficient role");
  }
  return ctx;
}

export async function requireOrganizationAccess(
  organizationId: string
): Promise<AuthContext> {
  const ctx = await requireAuth();

  if (ctx.role === UserRole.PLATFORM_ADMIN) return ctx;

  if (ctx.organizationId !== organizationId) {
    throw new AuthorizationError("Organization access denied");
  }
  return ctx;
}

export async function canAccessCandidateData(
  ctx: AuthContext,
  candidateProfileId: string
): Promise<boolean> {
  if (ctx.role === UserRole.CANDIDATE) {
    const profile = await db.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      select: { userId: true },
    });
    return profile?.userId === ctx.userId;
  }

  if (
    ctx.role === UserRole.RECRUITER ||
    ctx.role === UserRole.HIRING_MANAGER ||
    ctx.role === UserRole.AGENCY_ADMIN
  ) {
    if (!ctx.organizationId) return false;

    const hasAccess = await db.application.findFirst({
      where: {
        candidateProfileId,
        job: { organizationId: ctx.organizationId },
      },
    });
    if (hasAccess) return true;

    const inPool = await db.talentPoolMember.findFirst({
      where: {
        candidateProfileId,
        talentPool: { organizationId: ctx.organizationId },
      },
    });
    return !!inPool;
  }

  return ctx.role === UserRole.PLATFORM_ADMIN;
}
