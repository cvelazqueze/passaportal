import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import {
  normalizeOpportunityInput,
  opportunityPatchSchema,
} from "@/lib/candidate/opportunity-schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;
    const body = await request.json();
    const parsed = opportunityPatchSchema.safeParse(body);

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

    const patch = parsed.data;
    const data: Record<string, unknown> = {};

    if (patch.title !== undefined) data.title = patch.title.trim();
    if (patch.company !== undefined) data.company = patch.company?.trim() || null;
    if (patch.client !== undefined) data.client = patch.client?.trim() || null;
    if (patch.pipelineStageId !== undefined) data.pipelineStageId = patch.pipelineStageId;
    if (patch.source !== undefined) data.source = patch.source?.trim() || null;
    if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
    if (patch.recruiterName !== undefined) {
      data.recruiterName = patch.recruiterName?.trim() || null;
    }
    if (patch.recruiterContact !== undefined) {
      data.recruiterContact = patch.recruiterContact?.trim() || null;
    }
    if (patch.salaryMin !== undefined) data.salaryMin = patch.salaryMin;
    if (patch.salaryMax !== undefined) data.salaryMax = patch.salaryMax;
    if (patch.salaryCurrency !== undefined) {
      data.salaryCurrency = patch.salaryCurrency?.trim() || "USD";
    }
    if (patch.contractType !== undefined) {
      data.contractType = patch.contractType?.trim() || null;
    }
    if (patch.duration !== undefined) data.duration = patch.duration?.trim() || null;
    if (patch.workType !== undefined) data.workType = patch.workType;
    if (patch.benefits !== undefined) data.benefits = patch.benefits;
    if (patch.technologies !== undefined) data.technologies = patch.technologies;

    const opportunity = await db.application.update({
      where: { id },
      data,
      include: { pipelineStage: true },
    });

    return NextResponse.json({ opportunity });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;

    const existing = await db.application.findFirst({
      where: { id, candidateProfileId: profile.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.application.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
