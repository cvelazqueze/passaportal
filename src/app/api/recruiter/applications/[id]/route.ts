import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { applicationStageSchema } from "@/lib/recruiter/application-schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId, session } = await requireRecruiterOrg();
    const { id } = await params;
    const body = await request.json();
    const parsed = applicationStageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.application.findFirst({
      where: { id, job: { organizationId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = await db.$transaction(async (tx) => {
      await tx.applicationStageHistory.create({
        data: {
          applicationId: id,
          fromStage: existing.stage,
          toStage: parsed.data.stage,
          changedById: session.user.id,
          reason: parsed.data.reason?.trim() || null,
        },
      });

      return tx.application.update({
        where: { id },
        data: { stage: parsed.data.stage },
        include: {
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          job: { select: { id: true, title: true } },
        },
      });
    });

    return NextResponse.json({ application });
  } catch (error) {
    return apiError(error);
  }
}
