import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthorizationError } from "@/lib/rbac/authorize";
import { UserRole } from "@prisma/client";

const RECRUITER_ROLES: UserRole[] = [UserRole.RECRUITER, UserRole.AGENCY_ADMIN];

export async function requireRecruiterOrg() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Authentication required");
  }

  const role = session.user.role as UserRole;
  if (!RECRUITER_ROLES.includes(role)) {
    throw new AuthorizationError("Recruiter access only");
  }

  let member = await db.organizationMember.findUnique({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!member && role === UserRole.RECRUITER) {
    const { initializeRecruiterWorkspace } = await import("@/lib/recruiter/onboarding");
    await initializeRecruiterWorkspace(
      session.user.id,
      session.user.name?.split(" ")[0] ?? "Recruiter"
    );
    member = await db.organizationMember.findUnique({
      where: { userId: session.user.id },
      include: { organization: true },
    });
  }

  if (!member) {
    throw new AuthorizationError("Organization membership required");
  }

  const recruiterProfile = await db.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });

  return {
    session,
    member,
    organization: member.organization,
    organizationId: member.organizationId,
    recruiterProfile,
  };
}
