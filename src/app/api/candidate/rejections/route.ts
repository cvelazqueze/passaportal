import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { getRejectionInsights } from "@/lib/candidate/analytics";
import {
  rejectionBodySchema,
  toRejectionDate,
} from "@/lib/candidate/rejection-schema";

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const [insights, reasons, records] = await Promise.all([
      getRejectionInsights(profile.id),
      db.rejectionReason.findMany({
        where: {
          OR: [
            { candidateProfileId: profile.id },
            { candidateProfileId: null, isSystemDefault: true },
          ],
        },
        orderBy: { label: "asc" },
      }),
      db.rejectionRecord.findMany({
        where: { application: { candidateProfileId: profile.id } },
        include: {
          reason: true,
          application: { select: { title: true, company: true } },
        },
        orderBy: { rejectedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ insights, reasons, records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = rejectionBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const app = await db.application.findFirst({
      where: { id: parsed.data.applicationId, candidateProfileId: profile.id },
      include: { pipelineStage: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const record = await db.rejectionRecord.create({
      data: {
        applicationId: parsed.data.applicationId,
        reasonId: parsed.data.reasonId || null,
        stageName: parsed.data.stageName?.trim() || app.pipelineStage?.name || null,
        candidateNotes: parsed.data.candidateNotes?.trim() || null,
        rejectedAt: parsed.data.rejectedAt
          ? toRejectionDate(parsed.data.rejectedAt)
          : new Date(),
      },
      include: {
        reason: true,
        application: { select: { title: true, company: true } },
      },
    });

    const rejectedStage = await db.candidatePipelineStage.findFirst({
      where: { candidateProfileId: profile.id, name: "Rejected" },
    });

    if (rejectedStage) {
      await db.application.update({
        where: { id: app.id },
        data: { pipelineStageId: rejectedStage.id },
      });
    }

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
