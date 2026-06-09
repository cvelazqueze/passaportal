import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.experience.count({ where: { talentPassportId } });
    const d = parsed.data;

    const experience = await db.experience.create({
      data: {
        talentPassportId,
        company: d.company,
        position: d.position,
        location: d.location,
        startDate: new Date(d.startDate),
        endDate: d.isCurrent ? null : d.endDate ? new Date(d.endDate) : null,
        isCurrent: d.isCurrent,
        achievements: d.achievements,
        technologies: d.technologies,
        sortOrder: count,
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
