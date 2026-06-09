import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
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

    const existing = await db.skill.findFirst({ where: { id, talentPassportId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const skill = await db.skill.update({ where: { id }, data: parsed.data });
    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ skill });
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
    const existing = await db.skill.findFirst({ where: { id, talentPassportId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.skill.delete({ where: { id } });
    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
