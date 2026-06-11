import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { jobBodySchema } from "@/lib/recruiter/job-schema";

export async function GET() {
  try {
    const { organizationId } = await requireRecruiterOrg();

    const jobs = await db.job.findMany({
      where: { organizationId },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const body = await request.json();
    const parsed = jobBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const job = await db.job.create({
      data: {
        organizationId,
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        requirements: parsed.data.requirements,
        requiredSkills: parsed.data.requiredSkills,
        preferredSkills: parsed.data.preferredSkills,
        location: parsed.data.location?.trim() || null,
        remote: parsed.data.remote,
        salaryMin: parsed.data.salaryMin ?? null,
        salaryMax: parsed.data.salaryMax ?? null,
        salaryCurrency: parsed.data.salaryCurrency?.trim() || "USD",
        status: parsed.data.status,
        clientId: parsed.data.clientId || null,
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
