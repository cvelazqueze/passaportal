import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { offerBodySchema } from "@/lib/candidate/offer-schema";

function normalizeOfferInput(data: ReturnType<typeof offerBodySchema.parse>) {
  return {
    applicationId: data.applicationId,
    baseSalary: data.baseSalary ?? null,
    currency: data.currency?.trim() || "USD",
    bonus: data.bonus?.trim() || null,
    ptoDays: data.ptoDays ?? null,
    remotePolicy: data.remotePolicy?.trim() || null,
    benefits: data.benefits,
    contractType: data.contractType?.trim() || null,
    equipment: data.equipment?.trim() || null,
    insurance: data.insurance?.trim() || null,
    flexibility: data.flexibility?.trim() || null,
    notes: data.notes?.trim() || null,
    isAccepted: data.isAccepted,
  };
}

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
    const parsed = offerBodySchema.safeParse(body);

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

    const payload = normalizeOfferInput(parsed.data);

    const offer = await db.offer.upsert({
      where: { applicationId: parsed.data.applicationId },
      create: payload,
      update: payload,
      include: { application: { select: { title: true, company: true, id: true } } },
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
