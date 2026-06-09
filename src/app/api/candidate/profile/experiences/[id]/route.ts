import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  company: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const talentPassportId = await getPassportId();
    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const existing = await db.experience.findFirst({
      where: { id, talentPassportId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const d = parsed.data;
    const experience = await db.experience.update({
      where: { id },
      data: {
        ...(d.company !== undefined && { company: d.company }),
        ...(d.position !== undefined && { position: d.position }),
        ...(d.location !== undefined && { location: d.location }),
        ...(d.startDate !== undefined && { startDate: new Date(d.startDate) }),
        ...(d.isCurrent !== undefined && { isCurrent: d.isCurrent }),
        ...(d.isCurrent === true && { endDate: null }),
        ...(d.endDate !== undefined && !d.isCurrent && { endDate: d.endDate ? new Date(d.endDate) : null }),
        ...(d.achievements !== undefined && { achievements: d.achievements }),
        ...(d.technologies !== undefined && { technologies: d.technologies }),
        ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ experience });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const talentPassportId = await getPassportId();
    const { id } = await params;

    const existing = await db.experience.findFirst({
      where: { id, talentPassportId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.experience.delete({ where: { id } });
    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
