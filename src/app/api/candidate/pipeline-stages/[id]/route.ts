import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
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

    const existing = await db.candidatePipelineStage.findFirst({
      where: { id, candidateProfileId: profile.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    if (parsed.data.isArchived === true) {
      const fallback = await db.candidatePipelineStage.findFirst({
        where: {
          candidateProfileId: profile.id,
          isArchived: false,
          id: { not: id },
        },
        orderBy: { sortOrder: "asc" },
      });

      if (fallback) {
        await db.application.updateMany({
          where: { pipelineStageId: id },
          data: { pipelineStageId: fallback.id },
        });
      }
    }

    const stage = await db.candidatePipelineStage.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
        ...(parsed.data.isArchived !== undefined
          ? { isArchived: parsed.data.isArchived }
          : {}),
      },
    });

    return NextResponse.json({ stage });
  } catch (error) {
    return apiError(error);
  }
}
