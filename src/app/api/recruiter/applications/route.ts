import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";

export async function GET(request: Request) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    const applications = await db.application.findMany({
      where: {
        job: { organizationId },
        ...(jobId ? { jobId } : {}),
      },
      include: {
        candidateProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            talentPassport: {
              select: { professionalTitle: true, technologies: true },
            },
          },
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return apiError(error);
  }
}
