import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { interviewBodySchema, toScheduledAt } from "@/lib/recruiter/interview-schema";

export async function GET() {
  try {
    const { organizationId } = await requireRecruiterOrg();

    const interviews = await db.interview.findMany({
      where: { application: { job: { organizationId } } },
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
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const body = await request.json();
    const parsed = interviewBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const application = await db.application.findFirst({
      where: { id: parsed.data.applicationId, job: { organizationId } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const interview = await db.interview.create({
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

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
