import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const createOpportunitySchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  pipelineStageId: z.string().optional(),
  client: z.string().optional(),
  recruiterName: z.string().optional(),
  recruiterContact: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().default("USD"),
  contractType: z.string().optional(),
  benefits: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  source: z.string().optional(),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
});

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
    const parsed = createOpportunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    let pipelineStageId = parsed.data.pipelineStageId;
    if (!pipelineStageId) {
      const defaultStage = await db.candidatePipelineStage.findFirst({
        where: { candidateProfileId: profile.id, name: "Interested" },
      });
      pipelineStageId = defaultStage?.id;
    }

    const opportunity = await db.application.create({
      data: {
        candidateProfileId: profile.id,
        title: parsed.data.title,
        company: parsed.data.company,
        pipelineStageId,
        client: parsed.data.client,
        recruiterName: parsed.data.recruiterName,
        recruiterContact: parsed.data.recruiterContact,
        salaryMin: parsed.data.salaryMin,
        salaryMax: parsed.data.salaryMax,
        salaryCurrency: parsed.data.salaryCurrency,
        contractType: parsed.data.contractType,
        benefits: parsed.data.benefits,
        technologies: parsed.data.technologies,
        source: parsed.data.source,
        notes: parsed.data.notes,
        appliedAt: parsed.data.appliedAt
          ? new Date(parsed.data.appliedAt)
          : undefined,
      },
      include: { pipelineStage: true },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
