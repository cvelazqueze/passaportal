import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { outreachGenerateSchema } from "@/lib/candidate/outreach-schema";
import {
  analyzeJobDescription,
  matchProfileToJob,
} from "@/lib/candidate/job-analysis";
import {
  extractMatchingSkillsForOutreach,
  generateOutreach,
} from "@/lib/candidate/outreach-templates";
import { getServerLocale } from "@/lib/i18n/server";

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = outreachGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const locale = await getServerLocale();
    const { kind, jobTitle, company, description, recipientName } = parsed.data;

    const passport = await db.talentPassport.findUnique({
      where: { candidateProfileId: profile.id },
      include: {
        skills: true,
        experiences: { orderBy: { startDate: "desc" }, take: 1 },
      },
    });

    const analysis = description?.trim()
      ? analyzeJobDescription(description)
      : null;

    const profileSkillNames = [
      ...(passport?.skills.map((s) => s.name) ?? []),
      ...(passport?.technologies ?? []),
    ];

    let matchingSkills = profileSkillNames.slice(0, 5);

    if (analysis && passport) {
      const match = matchProfileToJob(
        {
          skills: passport.skills,
          technologies: passport.technologies,
          certifications: [],
          experiences: passport.experiences,
        },
        analysis
      );
      matchingSkills = extractMatchingSkillsForOutreach(
        analysis,
        match.matchingSkills.length > 0 ? match.matchingSkills : profileSkillNames
      );
    } else if (analysis) {
      matchingSkills = extractMatchingSkillsForOutreach(analysis, profileSkillNames);
    }

    const latestExp = passport?.experiences[0];

    const generated = generateOutreach(
      kind,
      {
        candidateName: `${profile.user.firstName} ${profile.user.lastName}`,
        candidateEmail: profile.user.email,
        candidateTitle: passport?.professionalTitle ?? "",
        professionalSummary: passport?.professionalSummary,
        matchingSkills,
        latestExperience: latestExp
          ? {
              title: latestExp.position,
              company: latestExp.company,
              highlights:
                latestExp.achievements[0] ?? latestExp.responsibilities[0] ?? null,
            }
          : null,
      },
      jobTitle,
      company,
      recipientName,
      locale
    );

    return NextResponse.json({
      ...generated,
      matchingSkills,
      analysis: analysis
        ? {
            matchPercentage:
              passport && analysis
                ? matchProfileToJob(
                    {
                      skills: passport.skills,
                      technologies: passport.technologies,
                      certifications: [],
                      experiences: passport.experiences,
                    },
                    analysis
                  ).matchPercentage
                : null,
          }
        : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
