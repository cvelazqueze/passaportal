import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthorizationError } from "@/lib/rbac/authorize";
import { UserRole } from "@prisma/client";

export async function requireCandidateProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Authentication required");
  }
  if (session.user.role !== UserRole.CANDIDATE) {
    throw new AuthorizationError("Candidate access only");
  }

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      talentPassport: true,
    },
  });

  if (!profile) {
    throw new AuthorizationError("Candidate profile not found");
  }

  return { session, profile };
}

export async function getCandidateProfileOrNull() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.CANDIDATE) {
    return null;
  }

  return db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      talentPassport: true,
    },
  });
}
