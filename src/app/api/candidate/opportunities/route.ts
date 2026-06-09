import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import {
  normalizeOpportunityInput,
  opportunityBodySchema,
} from "@/lib/candidate/opportunity-schema";

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();

    const [opportunities, stages] = await Promise.all([
      db.application.findMany({
        where: { candidateProfileId: profile.id },
        include: {
          pipelineStage: true,
          offer: true,
          rejectionRecords: { include: { reason: true } },
          candidateInterviews: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.candidatePipelineStage.findMany({
        where: { candidateProfileId: profile.id, isArchived: false },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({ opportunities, stages });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = opportunityBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = normalizeOpportunityInput(parsed.data);

    let pipelineStageId = data.pipelineStageId;
    if (!pipelineStageId) {
      const firstStage = await db.candidatePipelineStage.findFirst({
        where: { candidateProfileId: profile.id, isArchived: false },
        orderBy: { sortOrder: "asc" },
      });
      pipelineStageId = firstStage?.id ?? null;
    }

    const opportunity = await db.application.create({
      data: {
        candidateProfileId: profile.id,
        ...data,
        pipelineStageId,
      },
      include: { pipelineStage: true },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
