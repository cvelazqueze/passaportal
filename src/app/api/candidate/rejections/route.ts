import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { getRejectionInsights } from "@/lib/candidate/analytics";
import { z } from "zod";

const createSchema = z.object({
  applicationId: z.string(),
  reasonId: z.string().optional(),
  stageName: z.string().optional(),
  candidateNotes: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const [insights, reasons] = await Promise.all([
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
    ]);
    return NextResponse.json({ insights, reasons });
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
        reasonId: parsed.data.reasonId,
        stageName: parsed.data.stageName ?? app.pipelineStage?.name,
        candidateNotes: parsed.data.candidateNotes,
        rejectedAt: parsed.data.rejectedAt
          ? new Date(parsed.data.rejectedAt)
          : new Date(),
      },
      include: { reason: true, application: { select: { title: true, company: true } } },
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
