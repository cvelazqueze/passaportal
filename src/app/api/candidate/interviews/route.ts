import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { interviewBodySchema, toInterviewDate } from "@/lib/candidate/interview-schema";

export async function GET() {
  try {
    const { profile } = await requireCandidateProfile();
    const sessions = await db.candidateInterviewSession.findMany({
      where: { application: { candidateProfileId: profile.id } },
      include: {
        application: { select: { title: true, company: true } },
        questions: true,
      },
      orderBy: { interviewDate: "desc" },
    });

    const assignments = await db.takeHomeAssignment.findMany({
      where: { application: { candidateProfileId: profile.id } },
      include: { application: { select: { title: true, company: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sessions, assignments });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCandidateProfile();
    const body = await request.json();
    const parsed = interviewBodySchema.safeParse(body);

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

    const session = await db.candidateInterviewSession.create({
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
      include: { questions: true, application: { select: { title: true, company: true } } },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
