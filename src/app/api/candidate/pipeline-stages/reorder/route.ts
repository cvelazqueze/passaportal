import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const reorderSchema = z.object({
  stageIds: z.array(z.string()).min(1),
});

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const owned = await db.candidatePipelineStage.findMany({
      where: { candidateProfileId: profile.id },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((s) => s.id));

    if (!parsed.data.stageIds.every((id) => ownedIds.has(id))) {
      return NextResponse.json({ error: "Invalid stage order" }, { status: 400 });
    }

    await db.$transaction(
      parsed.data.stageIds.map((id, index) =>
        db.candidatePipelineStage.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const stages = await db.candidatePipelineStage.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    return apiError(error);
  }
}
