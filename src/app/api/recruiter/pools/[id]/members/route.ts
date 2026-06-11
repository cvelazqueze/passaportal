import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { poolMemberSchema } from "@/lib/recruiter/pool-schema";

async function getOwnedPool(id: string, organizationId: string) {
  return db.talentPool.findFirst({ where: { id, organizationId } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;
    const body = await request.json();
    const parsed = poolMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const pool = await getOwnedPool(id, organizationId);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { id: parsed.data.candidateProfileId },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const member = await db.talentPoolMember.upsert({
      where: {
        talentPoolId_candidateProfileId: {
          talentPoolId: id,
          candidateProfileId: parsed.data.candidateProfileId,
        },
      },
      create: {
        talentPoolId: id,
        candidateProfileId: parsed.data.candidateProfileId,
        notes: parsed.data.notes?.trim() || null,
      },
      update: {
        notes: parsed.data.notes?.trim() || null,
      },
      include: {
        candidateProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            talentPassport: { select: { professionalTitle: true } },
          },
        },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireRecruiterOrg();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const candidateProfileId = searchParams.get("candidateProfileId");

    if (!candidateProfileId) {
      return NextResponse.json({ error: "candidateProfileId required" }, { status: 400 });
    }

    const pool = await getOwnedPool(id, organizationId);
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    await db.talentPoolMember.deleteMany({
      where: { talentPoolId: id, candidateProfileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
