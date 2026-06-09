import { db } from "@/lib/db";

export interface CandidateMetrics {
  applicationsSubmitted: number;
  interviewRate: number;
  offerRate: number;
}

export interface RecruiterMetrics {
  candidatesReviewed: number;
  interviewsConducted: number;
  offersExtended: number;
  timeToFill: number | null;
}

export interface AgencyMetrics {
  recruiterProductivity: { recruiterId: string; name: string; placements: number }[];
  clientActivity: { clientId: string; name: string; openJobs: number }[];
  pipelineHealth: { stage: string; count: number }[];
}

export async function getCandidateMetrics(
  candidateProfileId: string
): Promise<CandidateMetrics> {
  const applications = await db.application.findMany({
    where: { candidateProfileId },
    include: { interviews: true },
  });

  const total = applications.length;
  const withInterviews = applications.filter((a) => a.interviews.length > 0).length;
  const withOffers = applications.filter((a) =>
    ["OFFER", "ACCEPTED"].includes(a.stage)
  ).length;

  return {
    applicationsSubmitted: total,
    interviewRate: total > 0 ? Math.round((withInterviews / total) * 100) : 0,
    offerRate: total > 0 ? Math.round((withOffers / total) * 100) : 0,
  };
}

export async function getRecruiterMetrics(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RecruiterMetrics> {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  const [applications, interviews, offers] = await Promise.all([
    db.application.count({
      where: {
        job: { organizationId },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    }),
    db.interview.count({
      where: {
        application: { job: { organizationId } },
        status: "COMPLETED",
        ...(Object.keys(dateFilter).length > 0 && { scheduledAt: dateFilter }),
      },
    }),
    db.application.count({
      where: {
        job: { organizationId },
        stage: { in: ["OFFER", "ACCEPTED"] },
        ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
      },
    }),
  ]);

  return {
    candidatesReviewed: applications,
    interviewsConducted: interviews,
    offersExtended: offers,
    timeToFill: null,
  };
}

export async function getAgencyMetrics(
  organizationId: string
): Promise<AgencyMetrics> {
  const [members, clients, pipeline] = await Promise.all([
    db.organizationMember.findMany({
      where: { organizationId, role: "RECRUITER" },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    db.client.findMany({
      where: { organizationId, isActive: true },
      include: { _count: { select: { jobs: true } } },
    }),
    db.application.groupBy({
      by: ["stage"],
      where: { job: { organizationId } },
      _count: true,
    }),
  ]);

  return {
    recruiterProductivity: members.map((m) => ({
      recruiterId: m.userId,
      name: `${m.user.firstName} ${m.user.lastName}`,
      placements: 0,
    })),
    clientActivity: clients.map((c) => ({
      clientId: c.id,
      name: c.name,
      openJobs: c._count.jobs,
    })),
    pipelineHealth: pipeline.map((p) => ({
      stage: p.stage,
      count: p._count,
    })),
  };
}
