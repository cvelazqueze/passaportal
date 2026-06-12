import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { outreachUpdateSchema } from "@/lib/candidate/outreach-schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = outreachUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.outreachDraft.findFirst({
      where: { id, candidateProfileId: profile.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const data = parsed.data;

    if (data.applicationId) {
      const app = await db.application.findFirst({
        where: { id: data.applicationId, candidateProfileId: profile.id },
      });
      if (!app) {
        return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
      }
    }

    const draft = await db.outreachDraft.update({
      where: { id },
      data: {
        ...(data.kind !== undefined && { kind: data.kind }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.recipientName !== undefined && {
          recipientName: data.recipientName || null,
        }),
        ...(data.recipientEmail !== undefined && {
          recipientEmail: data.recipientEmail || null,
        }),
        ...(data.subject !== undefined && { subject: data.subject || null }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.applicationId !== undefined && {
          applicationId: data.applicationId || null,
        }),
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await context.params;

    const existing = await db.outreachDraft.findFirst({
      where: { id, candidateProfileId: profile.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    await db.outreachDraft.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
