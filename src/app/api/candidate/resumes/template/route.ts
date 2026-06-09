import { NextResponse } from "next/server";
import { ResumeTemplate } from "@prisma/client";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  template: z.nativeEnum(ResumeTemplate),
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const passport = profile.talentPassport;
    if (!passport) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    let master = await db.resumeVersion.findFirst({
      where: { talentPassportId: passport.id, isMaster: true },
    });

    if (!master) {
      master = await db.resumeVersion.create({
        data: {
          talentPassportId: passport.id,
          name: "Master Resume",
          template: parsed.data.template,
          isMaster: true,
          isDefault: true,
          targetRole: "General",
        },
      });
    } else {
      master = await db.resumeVersion.update({
        where: { id: master.id },
        data: { template: parsed.data.template },
      });
    }

    return NextResponse.json({ resume: master });
  } catch (error) {
    return apiError(error);
  }
}
