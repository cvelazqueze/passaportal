import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  analyzeJobDescription,
  matchProfileToJob,
} from "@/lib/candidate/job-analysis";

const createSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(20),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const workspaces = await db.jobDescriptionWorkspace.findMany({
      where: { candidateProfileId: profile.id },
      include: { resumeVersion: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ workspaces });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const analysis = analyzeJobDescription(parsed.data.description);

    const passport = await db.talentPassport.findUnique({
      where: { candidateProfileId: profile.id },
      include: {
        skills: true,
        certifications: true,
        experiences: true,
      },
    });

    const matchAnalysis = passport
      ? matchProfileToJob(
          {
            skills: passport.skills,
            technologies: passport.technologies,
            certifications: passport.certifications,
            experiences: passport.experiences,
          },
          analysis
        )
      : { matchingSkills: [], missingSkills: [], suggestions: [], matchPercentage: 0 };

    const workspace = await db.jobDescriptionWorkspace.create({
      data: {
        candidateProfileId: profile.id,
        jobTitle: parsed.data.jobTitle,
        company: parsed.data.company,
        description: parsed.data.description,
        analysis: analysis as unknown as Prisma.InputJsonValue,
        matchAnalysis: matchAnalysis as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ workspace, analysis, matchAnalysis }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
