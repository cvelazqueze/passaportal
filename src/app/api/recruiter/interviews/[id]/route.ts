import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { interviewBodySchema, toScheduledAt } from "@/lib/recruiter/interview-schema";

async function getOwnedInterview(id: string, organizationId: string) {
  return db.interview.findFirst({
    where: { id, application: { job: { organizationId } } },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;
    const body = await request.json();
    const parsed = interviewBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedInterview(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const application = await db.application.findFirst({
      where: { id: parsed.data.applicationId, job: { organizationId } },
    });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const interview = await db.interview.update({
      where: { id },
      data: {
        applicationId: parsed.data.applicationId,
        type: parsed.data.type,
        status: parsed.data.status,
        scheduledAt: toScheduledAt(parsed.data.scheduledAt),
        duration: parsed.data.duration,
        location: parsed.data.location?.trim() || null,
        meetingUrl: parsed.data.meetingUrl?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
      },
      include: {
        application: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            job: { select: { title: true } },
          },
        },
      },
    });

    return NextResponse.json({ interview });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;

    const existing = await getOwnedInterview(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    await db.interview.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
