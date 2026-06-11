import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { poolBodySchema } from "@/lib/recruiter/pool-schema";

export async function GET() {
  try {
    const { organizationId } = await requireRecruiterOrg();

    const pools = await db.talentPool.findMany({
      where: { organizationId },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                talentPassport: {
                  select: { professionalTitle: true, technologies: true },
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ pools });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const body = await request.json();
    const parsed = poolBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const pool = await db.talentPool.create({
      data: {
        organizationId,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
      },
      include: { _count: { select: { members: true } }, members: true },
    });

    return NextResponse.json({ pool }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
