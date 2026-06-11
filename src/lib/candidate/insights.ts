import { db } from "@/lib/db";
import { getCandidateAnalytics, getRejectionInsights } from "@/lib/candidate/analytics";
import { buildInsightMessages } from "@/lib/i18n/insights-messages";
import { getDictionary, type Locale } from "@/lib/i18n";

export interface CandidateInsight {
  id: string;
  type: "resume" | "technology" | "timing" | "salary" | "rejection" | "general";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export async function generateCandidateInsights(
  candidateProfileId: string,
  locale: Locale = "en"
): Promise<CandidateInsight[]> {
  const [analytics, rejections, applications, resumeVersions] = await Promise.all([
    getCandidateAnalytics(candidateProfileId),
    getRejectionInsights(candidateProfileId),
    db.application.findMany({
      where: { candidateProfileId },
      include: { pipelineStage: true, candidateInterviews: true },
    }),
    db.resumeVersion.findMany({
      where: {
        talentPassport: { candidateProfileId },
        status: "ACTIVE",
        isMaster: false,
      },
    }),
  ]);

  const respondedWithin7Days = applications.filter((a) => {
    if (!a.appliedAt) return false;
    const daysSince =
      (Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
    const hasProgress =
      a.pipelineStage?.name !== "Applied" &&
      a.pipelineStage?.name !== "Interested";
    return daysSince <= 7 && hasProgress;
  });

  const responseRate =
    applications.length >= 3
      ? Math.round((respondedWithin7Days.length / applications.length) * 100)
      : -1;

  const insights = buildInsightMessages(locale, {
    applicationToInterviewRate: analytics.applicationToInterviewRate,
    topRejectionStage: rejections.byStage[0],
    topRejectionReason: rejections.byReason[0],
    responseRate,
    resumeVersionCount: resumeVersions.length,
    salaryAppliedAvg: analytics.salaryApplied.avg ?? undefined,
    salaryOfferedAvg: analytics.salaryOffered.avg ?? undefined,
    improvementAreas: analytics.improvementAreas,
  });

  if (insights.length === 0) {
    const t = getDictionary(locale);
    insights.push({
      id: "getting-started",
      type: "general",
      title: t.insightsPage.gettingStartedTitle,
      description: t.insightsPage.gettingStartedDesc,
      priority: "medium",
    });
  }

  return insights;
}
