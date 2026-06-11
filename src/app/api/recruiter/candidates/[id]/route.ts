import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { canAccessCandidateData, getAuthContext } from "@/lib/rbac/authorize";
import { scoreCandidate } from "@/lib/scoring/candidate-ranking";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRecruiterOrg();
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const allowed = await canAccessCandidateData(ctx, id);
    if (!allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        talentPassport: {
          include: {
            experiences: { orderBy: { startDate: "desc" }, take: 5 },
            skills: { orderBy: { name: "asc" } },
            education: { orderBy: { startDate: "desc" }, take: 3 },
            certifications: true,
            languages: true,
          },
        },
        applications: {
          where: ctx.organizationId
            ? { job: { organizationId: ctx.organizationId } }
            : undefined,
          include: { job: { select: { id: true, title: true, requiredSkills: true, preferredSkills: true } } },
        },
        talentPoolMembers: {
          where: ctx.organizationId
            ? { talentPool: { organizationId: ctx.organizationId } }
            : undefined,
          include: { talentPool: { select: { name: true } } },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const jobScores = candidate.applications
      .filter((a) => a.job && candidate.talentPassport)
      .map((a) => ({
        jobId: a.job!.id,
        jobTitle: a.job!.title,
        score: scoreCandidate(
          {
            skills: candidate.talentPassport!.skills.map((s) => ({
              name: s.name,
              yearsExperience: s.yearsExperience,
            })),
            certifications: candidate.talentPassport!.certifications.map((c) => ({
              name: c.name,
            })),
            experiences: candidate.talentPassport!.experiences.map((e) => ({
              startDate: e.startDate,
              endDate: e.endDate,
              isCurrent: e.isCurrent,
            })),
            languages: candidate.talentPassport!.languages.map((l) => l.name),
          },
          {
            requiredSkills: a.job!.requiredSkills,
            preferredSkills: a.job!.preferredSkills,
          }
        ),
      }));

    return NextResponse.json({ candidate, jobScores });
  } catch (error) {
    return apiError(error);
  }
}
