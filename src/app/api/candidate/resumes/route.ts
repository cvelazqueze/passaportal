import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";
import { ResumeTemplate } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1),
  template: z.nativeEnum(ResumeTemplate).default("MODERN"),
  targetRole: z.string().optional(),
  duplicateFromId: z.string().optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const resumes = await db.resumeVersion.findMany({
      where: {
        talentPassport: { candidateProfileId: profile.id },
      },
      include: {
        exportHistory: { orderBy: { exportedAt: "desc" }, take: 3 },
      },
      orderBy: [{ isMaster: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ resumes });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const passport = profile.talentPassport;
    if (!passport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    let includedSections: object = {};
    let template = parsed.data.template;
    let targetRole = parsed.data.targetRole;

    if (parsed.data.duplicateFromId) {
      const source = await db.resumeVersion.findFirst({
        where: {
          id: parsed.data.duplicateFromId,
          talentPassportId: passport.id,
        },
      });
      if (source) {
        template = source.template;
        targetRole = source.targetRole ?? parsed.data.targetRole;
        includedSections = (source.includedSections as object) ?? {};
      }
    }

    const resume = await db.resumeVersion.create({
      data: {
        talentPassportId: passport.id,
        name: parsed.data.name,
        template,
        targetRole,
        isMaster: false,
        includedSections,
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
