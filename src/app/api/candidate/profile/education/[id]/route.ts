import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  institution: z.string().min(1).optional(),
  degree: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const talentPassportId = await getPassportId();
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const existing = await db.education.findFirst({ where: { id, talentPassportId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const d = parsed.data;
    const education = await db.education.update({
      where: { id },
      data: {
        ...(d.institution !== undefined && { institution: d.institution }),
        ...(d.degree !== undefined && { degree: d.degree }),
        ...(d.location !== undefined && { location: d.location }),
        ...(d.startDate !== undefined && { startDate: new Date(d.startDate) }),
        ...(d.endDate !== undefined && { endDate: d.endDate ? new Date(d.endDate) : null }),
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ education });
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
    const existing = await db.education.findFirst({ where: { id, talentPassportId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.education.delete({ where: { id } });
    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
