import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { ProficiencyLevel } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  proficiency: z.nativeEnum(ProficiencyLevel).optional(),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.language.count({ where: { talentPassportId } });
    const language = await db.language.create({
      data: {
        talentPassportId,
        name: parsed.data.name,
        proficiency: parsed.data.proficiency ?? ProficiencyLevel.INTERMEDIATE,
        sortOrder: count,
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
