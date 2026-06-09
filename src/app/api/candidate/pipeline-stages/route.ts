import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const stages = await db.candidatePipelineStage.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ stages });
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

    const maxOrder = await db.candidatePipelineStage.aggregate({
      where: { candidateProfileId: profile.id },
      _max: { sortOrder: true },
    });

    const stage = await db.candidatePipelineStage.create({
      data: {
        candidateProfileId: profile.id,
        name: parsed.data.name.trim(),
        color: parsed.data.color ?? "bg-slate-100",
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        isSystemDefault: false,
      },
    });

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
