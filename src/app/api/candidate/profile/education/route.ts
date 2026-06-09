import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.education.count({ where: { talentPassportId } });
    const d = parsed.data;

    const education = await db.education.create({
      data: {
        talentPassportId,
        institution: d.institution,
        degree: d.degree,
        location: d.location,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
        sortOrder: count,
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ education }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
