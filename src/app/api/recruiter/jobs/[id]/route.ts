import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { jobBodySchema } from "@/lib/recruiter/job-schema";

async function getOwnedJob(id: string, organizationId: string) {
  return db.job.findFirst({ where: { id, organizationId } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;

    const job = await db.job.findFirst({
      where: { id, organizationId },
      include: {
        client: { select: { id: true, name: true } },
        applications: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                talentPassport: {
                  select: {
                    professionalTitle: true,
                    technologies: true,
                    completeness: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;
    const body = await request.json();
    const parsed = jobBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedJob(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = await db.job.update({
      where: { id },
      data: {
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

    return NextResponse.json({ job });
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

    const existing = await getOwnedJob(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await db.job.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
