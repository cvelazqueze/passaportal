import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

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
                  skills: { select: { name: true } },
                },
              },
            },
          },
          job: { select: { title: true } },
        },
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
                  skills: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const seen = new Set<string>();
    const results: {
      id: string;
      name: string;
      email: string;
      title: string | null;
      matchReason: string;
    }[] = [];

    function matches(
      firstName: string,
      lastName: string,
      email: string,
      title: string | null,
      techs: string[],
      skills: string[]
    ) {
      const haystack = [
        firstName,
        lastName,
        email,
        title ?? "",
        ...techs,
        ...skills,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }

    for (const app of applications) {
      const cp = app.candidateProfile;
      const passport = cp.talentPassport;
      if (seen.has(cp.id)) continue;
      if (
        matches(
          cp.user.firstName,
          cp.user.lastName,
          cp.user.email,
          passport?.professionalTitle ?? null,
          passport?.technologies ?? [],
          passport?.skills.map((s) => s.name) ?? []
        )
      ) {
        seen.add(cp.id);
        results.push({
          id: cp.id,
          name: `${cp.user.firstName} ${cp.user.lastName}`,
          email: cp.user.email,
          title: passport?.professionalTitle ?? null,
          matchReason: app.job?.title ? `Applied: ${app.job.title}` : "Application",
        });
      }
    }

    for (const member of poolMembers) {
      const cp = member.candidateProfile;
      const passport = cp.talentPassport;
      if (seen.has(cp.id)) continue;
      if (
        matches(
          cp.user.firstName,
          cp.user.lastName,
          cp.user.email,
          passport?.professionalTitle ?? null,
          passport?.technologies ?? [],
          passport?.skills.map((s) => s.name) ?? []
        )
      ) {
        seen.add(cp.id);
        results.push({
          id: cp.id,
          name: `${cp.user.firstName} ${cp.user.lastName}`,
          email: cp.user.email,
          title: passport?.professionalTitle ?? null,
          matchReason: "In talent pool",
        });
      }
    }

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    return apiError(error);
  }
}
