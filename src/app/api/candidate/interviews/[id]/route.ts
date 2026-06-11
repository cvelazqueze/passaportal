import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { interviewBodySchema, toInterviewDate } from "@/lib/candidate/interview-schema";

async function getOwnedSession(id: string, profileId: string) {
  return db.candidateInterviewSession.findFirst({
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
    const parsed = interviewBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await getOwnedSession(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const app = await db.application.findFirst({
      where: { id: parsed.data.applicationId, candidateProfileId: profile.id },
    });

    if (!app) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const session = await db.$transaction(async (tx) => {
      await tx.interviewQuestionRecord.deleteMany({ where: { sessionId: id } });

      return tx.candidateInterviewSession.update({
        where: { id },
        data: {
          applicationId: parsed.data.applicationId,
          interviewDate: toInterviewDate(parsed.data.interviewDate),
          interviewType: parsed.data.interviewType,
          interviewer: parsed.data.interviewer?.trim() || null,
          notes: parsed.data.notes?.trim() || null,
          outcome: parsed.data.outcome?.trim() || null,
          lessonsLearned: parsed.data.lessonsLearned?.trim() || null,
          questions: {
            create: [
              ...parsed.data.technicalQuestions.map((q) => ({
                questionType: "TECHNICAL" as const,
                question: q,
              })),
              ...parsed.data.behavioralQuestions.map((q) => ({
                questionType: "BEHAVIORAL" as const,
                question: q,
              })),
            ],
          },
        },
        include: {
          questions: true,
          application: { select: { title: true, company: true } },
        },
      });
    });

    return NextResponse.json({ session });
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

    const existing = await getOwnedSession(id, profile.id);
    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    await db.candidateInterviewSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
