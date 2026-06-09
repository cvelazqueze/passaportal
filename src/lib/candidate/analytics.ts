import { db } from "@/lib/db";

export interface CandidateAnalytics {
  applicationsSubmitted: number;
  interviews: number;
  technicalInterviews: number;
  offers: number;
  rejections: number;
  ghosted: number;
  accepted: number;
  applicationToInterviewRate: number;
  interviewToOfferRate: number;
  offerToAcceptanceRate: number;
  salaryApplied: { avg: number | null; min: number | null; max: number | null };
  salaryOffered: { avg: number | null; min: number | null; max: number | null };
  topTechnologies: { name: string; count: number }[];
  resumePerformance: { name: string; applications: number; interviews: number }[];
}

export async function getCandidateAnalytics(
  candidateProfileId: string
): Promise<CandidateAnalytics> {
  const [applications, interviews, _rejections, offers, stages] = await Promise.all([
    db.application.findMany({
      where: { candidateProfileId },
      include: {
        pipelineStage: true,
        candidateInterviews: true,
        offer: true,
        rejectionRecords: true,
      },
    }),
    db.candidateInterviewSession.findMany({
      where: { application: { candidateProfileId } },
    }),
    db.rejectionRecord.findMany({
      where: { application: { candidateProfileId } },
    }),
    db.offer.findMany({
      where: { application: { candidateProfileId } },
    }),
    db.candidatePipelineStage.findMany({
      where: { candidateProfileId },
    }),
  ]);

  const stageById = new Map(stages.map((s) => [s.id, s.name.toLowerCase()]));

  const getStageName = (app: (typeof applications)[0]) =>
    app.pipelineStage?.name.toLowerCase() ??
    stageById.get(app.pipelineStageId ?? "") ??
    app.stage.toLowerCase();

  const interviewStages = applications.filter((a) => {
    const name = getStageName(a);
    return name.includes("interview") || a.candidateInterviews.length > 0;
  });

  const offerApps = applications.filter((a) => {
    const name = getStageName(a);
    return name.includes("offer") || a.offer;
  });

  const rejectedApps = applications.filter((a) => {
    const name = getStageName(a);
    return name.includes("reject") || a.rejectionRecords.length > 0;
  });

  const ghostedApps = applications.filter((a) =>
    getStageName(a).includes("ghost")
  );

  const acceptedApps = applications.filter((a) => {
    const name = getStageName(a);
    return name.includes("accept") || a.offer?.isAccepted;
  });

  const technicalInterviews = interviews.filter(
    (i) => i.interviewType === "TECHNICAL"
  ).length;

  const appliedSalaries = applications
    .map((a) => a.salaryMax ?? a.salaryMin)
    .filter((s): s is number => s != null);

  const offeredSalaries = offers
    .map((o) => o.baseSalary)
    .filter((s): s is number => s != null);

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

  const techCounts = new Map<string, number>();
  for (const app of applications) {
    for (const tech of app.technologies) {
      techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
    }
  }

  const topTechnologies = Array.from(techCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const total = applications.length;
  const withInterviews = interviewStages.length;
  const withOffers = offerApps.length;
  const withAccepted = acceptedApps.length;

  return {
    applicationsSubmitted: total,
    interviews: interviews.length,
    technicalInterviews,
    offers: offers.length,
    rejections: rejectedApps.length,
    ghosted: ghostedApps.length,
    accepted: withAccepted,
    applicationToInterviewRate: total ? Math.round((withInterviews / total) * 100) : 0,
    interviewToOfferRate: withInterviews
      ? Math.round((withOffers / withInterviews) * 100)
      : 0,
    offerToAcceptanceRate: withOffers
      ? Math.round((withAccepted / withOffers) * 100)
      : 0,
    salaryApplied: {
      avg: avg(appliedSalaries),
      min: appliedSalaries.length ? Math.min(...appliedSalaries) : null,
      max: appliedSalaries.length ? Math.max(...appliedSalaries) : null,
    },
    salaryOffered: {
      avg: avg(offeredSalaries),
      min: offeredSalaries.length ? Math.min(...offeredSalaries) : null,
      max: offeredSalaries.length ? Math.max(...offeredSalaries) : null,
    },
    topTechnologies,
    resumePerformance: [],
  };
}

export async function getRejectionInsights(candidateProfileId: string) {
  const records = await db.rejectionRecord.findMany({
    where: { application: { candidateProfileId } },
    include: { reason: true, application: { select: { title: true, company: true } } },
    orderBy: { rejectedAt: "desc" },
  });

  const byStage = new Map<string, number>();
  const byReason = new Map<string, number>();

  for (const r of records) {
    const stage = r.stageName ?? "Unknown";
    byStage.set(stage, (byStage.get(stage) ?? 0) + 1);
    const reason = r.reason?.label ?? "Unspecified";
    byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
  }

  return {
    total: records.length,
    byStage: Array.from(byStage.entries())
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count),
    byReason: Array.from(byReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    recent: records.slice(0, 5),
  };
}
