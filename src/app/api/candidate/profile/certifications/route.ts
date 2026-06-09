import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.certification.count({ where: { talentPassportId } });
    const certification = await db.certification.create({
      data: { talentPassportId, ...parsed.data, sortOrder: count },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ certification }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
