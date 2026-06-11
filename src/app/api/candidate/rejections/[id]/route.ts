import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import {
  rejectionBodySchema,
  toRejectionDate,
} from "@/lib/candidate/rejection-schema";

async function getOwnedRecord(id: string, profileId: string) {
  return db.rejectionRecord.findFirst({
    where: { id, application: { candidateProfileId: profileId } },
    include: { application: { include: { pipelineStage: true } } },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;
    const body = await request.json();
    const parsed = rejectionBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedRecord(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Rejection not found" }, { status: 404 });
    }

    const app = await db.application.findFirst({
      where: { id: parsed.data.applicationId, candidateProfileId: profile.id },
      include: { pipelineStage: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const record = await db.rejectionRecord.update({
      where: { id },
      data: {
        applicationId: parsed.data.applicationId,
        reasonId: parsed.data.reasonId || null,
        stageName: parsed.data.stageName?.trim() || app.pipelineStage?.name || null,
        candidateNotes: parsed.data.candidateNotes?.trim() || null,
        rejectedAt: parsed.data.rejectedAt
          ? toRejectionDate(parsed.data.rejectedAt)
          : existing.rejectedAt,
      },
      include: {
        reason: true,
        application: { select: { title: true, company: true } },
      },
    });

    return NextResponse.json({ record });
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

    const existing = await getOwnedRecord(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Rejection not found" }, { status: 404 });
    }

    await db.rejectionRecord.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
