import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { computeAndSaveProfileCompleteness } from "@/lib/candidate/profile-completeness";
import { apiError } from "@/lib/api/error";
import { z } from "zod";
import { normalizeProfileUrl } from "@/lib/utils/url";

const optionalLink = z.string().max(500).optional().or(z.literal(""));

const updateProfileSchema = z.object({
  professionalTitle: z.string().max(100).optional(),
  professionalSummary: z.string().optional(),
  phone: z.string().max(30).optional(),
  linkedIn: optionalLink,
  portfolio: optionalLink,
  github: optionalLink,
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  careerGoals: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const passport = await db.talentPassport.findUnique({
      where: { candidateProfileId: profile.id },
      include: {
        experiences: { orderBy: { sortOrder: "asc" } },
        skills: { orderBy: { sortOrder: "asc" } },
        languages: { orderBy: { sortOrder: "asc" } },
        education: { orderBy: { sortOrder: "asc" } },
        certifications: { orderBy: { sortOrder: "asc" } },
        projects: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json({ profile, passport });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const passport = await db.talentPassport.update({
      where: { candidateProfileId: profile.id },
      data: {
        ...data,
        linkedIn: data.linkedIn !== undefined ? normalizeProfileUrl(data.linkedIn) ?? null : undefined,
        portfolio: data.portfolio !== undefined ? normalizeProfileUrl(data.portfolio) ?? null : undefined,
        github: data.github !== undefined ? normalizeProfileUrl(data.github) ?? null : undefined,
      },
    });

    const completeness = await computeAndSaveProfileCompleteness(passport.id);

    return NextResponse.json({ passport: { ...passport, completeness } });
  } catch (error) {
    return apiError(error);
  }
}
