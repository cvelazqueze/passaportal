import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";

export async function GET() {
  try {
    const { organizationId } = await requireRecruiterOrg();

    const [applications, poolMembers] = await Promise.all([
      db.application.findMany({
        where: { job: { organizationId } },
        include: {
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              talentPassport: {
                select: {
                  professionalTitle: true,
                  technologies: true,
                  completeness: true,
                  city: true,
                  country: true,
                },
              },
            },
          },
          job: { select: { title: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.talentPoolMember.findMany({
        where: { talentPool: { organizationId } },
        include: {
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              talentPassport: {
                select: {
                  professionalTitle: true,
                  technologies: true,
                  completeness: true,
                  city: true,
                  country: true,
                },
              },
            },
          },
          talentPool: { select: { name: true } },
        },
      }),
    ]);

    const byId = new Map<
      string,
      {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        professionalTitle: string | null;
        technologies: string[];
        completeness: number;
        location: string | null;
        applications: { id: string; jobTitle: string | null; stage: string }[];
        pools: string[];
      }
    >();

    for (const app of applications) {
      const cp = app.candidateProfile;
      const passport = cp.talentPassport;
      const entry = byId.get(cp.id) ?? {
        id: cp.id,
        firstName: cp.user.firstName,
        lastName: cp.user.lastName,
        email: cp.user.email,
        professionalTitle: passport?.professionalTitle ?? null,
        technologies: passport?.technologies ?? [],
        completeness: passport?.completeness ?? 0,
        location:
          passport?.city && passport?.country
            ? `${passport.city}, ${passport.country}`
            : passport?.city ?? passport?.country ?? null,
        applications: [],
        pools: [],
      };
      entry.applications.push({
        id: app.id,
        jobTitle: app.job?.title ?? null,
        stage: app.stage,
      });
      byId.set(cp.id, entry);
    }

    for (const member of poolMembers) {
      const cp = member.candidateProfile;
      const passport = cp.talentPassport;
      const entry = byId.get(cp.id) ?? {
        id: cp.id,
        firstName: cp.user.firstName,
        lastName: cp.user.lastName,
        email: cp.user.email,
        professionalTitle: passport?.professionalTitle ?? null,
        technologies: passport?.technologies ?? [],
        completeness: passport?.completeness ?? 0,
        location:
          passport?.city && passport?.country
            ? `${passport.city}, ${passport.country}`
            : passport?.city ?? passport?.country ?? null,
        applications: [],
        pools: [],
      };
      if (!entry.pools.includes(member.talentPool.name)) {
        entry.pools.push(member.talentPool.name);
      }
      byId.set(cp.id, entry);
    }

    const candidates = Array.from(byId.values()).sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );

    return NextResponse.json({ candidates });
  } catch (error) {
    return apiError(error);
  }
}
