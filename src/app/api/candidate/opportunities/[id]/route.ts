import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const updateSchema = z.object({
  pipelineStageId: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  technologies: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.application.findFirst({
      where: { id, candidateProfileId: profile.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const opportunity = await db.application.update({
      where: { id },
      data: parsed.data,
      include: { pipelineStage: true },
    });

    return NextResponse.json({ opportunity });
  } catch (error) {
    return apiError(error);
  }
}
