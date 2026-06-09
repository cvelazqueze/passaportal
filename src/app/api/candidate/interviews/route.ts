import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import { z } from "zod";
import { InterviewType } from "@prisma/client";

const createSchema = z.object({
  applicationId: z.string(),
  interviewDate: z.string().datetime(),
  interviewType: z.nativeEnum(InterviewType),
  interviewer: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  lessonsLearned: z.string().optional(),
  technicalQuestions: z.array(z.string()).default([]),
  behavioralQuestions: z.array(z.string()).default([]),
});

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

    const session = await db.candidateInterviewSession.create({
      data: {
        applicationId: parsed.data.applicationId,
        interviewDate: new Date(parsed.data.interviewDate),
        interviewType: parsed.data.interviewType,
        interviewer: parsed.data.interviewer,
        notes: parsed.data.notes,
        outcome: parsed.data.outcome,
        lessonsLearned: parsed.data.lessonsLearned,
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
