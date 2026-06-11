import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function initializeRecruiterWorkspace(
  userId: string,
  firstName: string
) {
  const existing = await db.organizationMember.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  const slug = `recruiter-${userId.slice(-10).toLowerCase()}`;

  const org = await db.organization.create({
    data: {
      name: `${firstName}'s Recruiting`,
      slug,
      subscription: { create: {} },
      talentPools: {
        create: {
          name: "General Talent Pool",
          description: "Default pool for sourced and referred candidates",
        },
      },
    },
  });

  return db.organizationMember.create({
    data: {
      userId,
      organizationId: org.id,
      role: UserRole.RECRUITER,
    },
  });
}
