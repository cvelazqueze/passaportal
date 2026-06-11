import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { poolBodySchema } from "@/lib/recruiter/pool-schema";

async function getOwnedPool(id: string, organizationId: string) {
  return db.talentPool.findFirst({ where: { id, organizationId } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;
    const body = await request.json();
    const parsed = poolBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedPool(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const pool = await db.talentPool.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
      },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            candidateProfile: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ pool });
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

    const existing = await getOwnedPool(id, organizationId);
    if (!existing) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    await db.talentPool.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
