import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api/error";
import { getPassportId, afterProfileMutation } from "@/lib/candidate/profile-mutations";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const talentPassportId = await getPassportId();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const count = await db.project.count({ where: { talentPassportId } });
    const project = await db.project.create({
      data: {
        talentPassportId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        technologies: parsed.data.technologies ?? [],
        sortOrder: count,
      },
    });

    await afterProfileMutation(talentPassportId);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
