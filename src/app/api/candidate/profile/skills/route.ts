import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.skill.count({ where: { talentPassportId } });
    const skill = await db.skill.create({
      data: {
        talentPassportId,
        name: parsed.data.name,
        category: parsed.data.category ?? "Other",
        sortOrder: count,
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
