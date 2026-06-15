import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCandidateProfile } from "@/lib/candidate/context";
import { apiError } from "@/lib/api/error";
import type { JobAnalysisResult, MatchAnalysisResult } from "@/lib/candidate/job-analysis";
import {
  buildOpportunityNotesFromAnalysis,
  technologiesFromJobAnalysis,
} from "@/lib/candidate/job-workspace-opportunity";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireCandidateProfile();
    const { id } = await context.params;

    const workspace = await db.jobDescriptionWorkspace.findFirst({
      where: { id, candidateProfileId: profile.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Job analysis not found" }, { status: 404 });
    }

    if (workspace.applicationId) {
      const existing = await db.application.findFirst({
        where: {
          id: workspace.applicationId,
          candidateProfileId: profile.id,
        },
        include: { pipelineStage: true },
      });

      if (existing) {
        return NextResponse.json({
          opportunity: existing,
          alreadyLinked: true,
        });
      }
    }

    const analysis = workspace.analysis as unknown as JobAnalysisResult;
    const matchAnalysis = workspace.matchAnalysis as unknown as MatchAnalysisResult;

    let pipelineStageId: string | null = null;
    const firstStage = await db.candidatePipelineStage.findFirst({
      where: { candidateProfileId: profile.id, isArchived: false },
      orderBy: { sortOrder: "asc" },
    });
    pipelineStageId = firstStage?.id ?? null;

    const opportunity = await db.application.create({
      data: {
        candidateProfileId: profile.id,
        title: workspace.jobTitle,
        company: workspace.company,
        pipelineStageId,
        source: "Job Workspace",
        technologies: technologiesFromJobAnalysis(analysis),
        score: matchAnalysis.matchPercentage,
        notes: buildOpportunityNotesFromAnalysis(matchAnalysis, analysis),
      },
      include: { pipelineStage: true },
    });

    await db.jobDescriptionWorkspace.update({
      where: { id: workspace.id },
      data: { applicationId: opportunity.id },
    });

    return NextResponse.json({ opportunity, alreadyLinked: false }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
