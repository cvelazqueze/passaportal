import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { resumeSelectionSchema } from "@/lib/resume/resume-selection";
import {
  mergeResumeCustomizations,
  resumeCustomizationsSchema,
} from "@/lib/resume/resume-customizations";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  targetRole: z.string().nullable().optional(),
  includedSections: resumeSelectionSchema.optional(),
  customizations: resumeCustomizationsSchema.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const passport = profile.talentPassport;
    if (!passport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const existing = await db.resumeVersion.findFirst({
      where: { id, talentPassportId: passport.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const customizations =
      parsed.data.customizations !== undefined
        ? mergeResumeCustomizations(
            existing.customizations,
            parsed.data.customizations
          )
        : undefined;

    const resume = await db.resumeVersion.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.targetRole !== undefined
          ? { targetRole: parsed.data.targetRole }
          : {}),
        ...(parsed.data.includedSections !== undefined
          ? { includedSections: parsed.data.includedSections }
          : {}),
        ...(customizations !== undefined
          ? { customizations }
          : {}),
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    return apiError(error);
  }
}
