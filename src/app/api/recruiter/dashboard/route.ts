import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRecruiterOrg } from "@/lib/recruiter/context";
import { apiError } from "@/lib/api/error";
import { getRecruiterMetrics, getAgencyMetrics } from "@/lib/reporting/metrics";

export async function GET() {
  try {
    const { organizationId, organization } = await requireRecruiterOrg();

    const [
      metrics,
      agency,
      openJobs,
      upcomingInterviews,
      recentApplications,
      talentPoolCount,
    ] = await Promise.all([
      getRecruiterMetrics(organizationId),
      getAgencyMetrics(organizationId),
      db.job.count({ where: { organizationId, status: "OPEN" } }),
      db.interview.count({
        where: {
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
          application: { job: { organizationId } },
        },
      }),
      db.application.findMany({
        where: { job: { organizationId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          candidateProfile: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          job: { select: { title: true } },
        },
      }),
      db.talentPoolMember.count({
        where: { talentPool: { organizationId } },
      }),
    ]);

    const activeStages = agency.pipelineHealth.filter(
      (s) => !["REJECTED", "ACCEPTED"].includes(s.stage)
    );
    const totalActive = activeStages.reduce((sum, s) => sum + s.count, 0);
    const advanced = activeStages
      .filter((s) =>
        ["SCREENING", "TECHNICAL_INTERVIEW", "HIRING_MANAGER_INTERVIEW", "FINAL_INTERVIEW", "OFFER"].includes(
          s.stage
        )
      )
      .reduce((sum, s) => sum + s.count, 0);
    const pipelineHealthPercent = totalActive
      ? Math.round((advanced / totalActive) * 100)
      : 0;

    return NextResponse.json({
      organization: { id: organization.id, name: organization.name },
      metrics,
      pipelineHealth: agency.pipelineHealth,
      pipelineHealthPercent,
      openJobs,
      talentPoolCount,
      upcomingInterviews,
      recentApplications,
    });
  } catch (error) {
    return apiError(error);
  }
}
