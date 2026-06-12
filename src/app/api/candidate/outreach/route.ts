import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { outreachDraftSchema } from "@/lib/candidate/outreach-schema";

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();

    const drafts = await db.outreachDraft.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: {
        application: {
          select: { id: true, title: true, company: true },
        },
      },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = outreachDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
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

    const draft = await db.outreachDraft.create({
      data: {
        candidateProfileId: profile.id,
        kind: data.kind,
        jobTitle: data.jobTitle,
        company: data.company,
        recipientName: data.recipientName || null,
        recipientEmail: data.recipientEmail || null,
        subject: data.subject || null,
        body: data.body,
        applicationId: data.applicationId || null,
      },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
