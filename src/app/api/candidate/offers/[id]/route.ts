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

async function getOwnedOffer(id: string, profileId: string) {
  return db.offer.findFirst({
    where: { id, application: { candidateProfileId: profileId } },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;
    const body = await request.json();
    const parsed = offerBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedOffer(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const app = await db.application.findFirst({
      where: { id: parsed.data.applicationId, candidateProfileId: profile.id },
    });

    if (!app) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const payload = normalizeOfferInput(parsed.data);

    const offer = await db.offer.update({
      where: { id },
      data: payload,
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

    return NextResponse.json({ offer });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await params;

    const existing = await getOwnedOffer(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    await db.offer.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
