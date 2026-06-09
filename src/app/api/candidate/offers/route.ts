import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";

const createSchema = z.object({
  applicationId: z.string(),
  baseSalary: z.number().optional(),
  currency: z.string().default("USD"),
  bonus: z.string().optional(),
  ptoDays: z.number().optional(),
  remotePolicy: z.string().optional(),
  benefits: z.array(z.string()).default([]),
  contractType: z.string().optional(),
  equipment: z.string().optional(),
  insurance: z.string().optional(),
  flexibility: z.string().optional(),
  notes: z.string().optional(),
  isAccepted: z.boolean().default(false),
});

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const offers = await db.offer.findMany({
      where: { application: { candidateProfileId: profile.id } },
      include: {
        application: { select: { title: true, company: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ offers });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const app = await db.application.findFirst({
      where: { id: parsed.data.applicationId, candidateProfileId: profile.id },
    });

    if (!app) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const offer = await db.offer.upsert({
      where: { applicationId: parsed.data.applicationId },
      create: parsed.data,
      update: parsed.data,
      include: { application: { select: { title: true, company: true } } },
    });

    if (parsed.data.isAccepted) {
      const acceptedStage = await db.candidatePipelineStage.findFirst({
        where: { candidateProfileId: profile.id, name: "Accepted" },
      });
      if (acceptedStage) {
        await db.application.update({
          where: { id: app.id },
          data: { pipelineStageId: acceptedStage.id },
        });
      }
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
