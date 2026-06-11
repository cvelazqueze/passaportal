"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, StatCard } from "@/components/candidate/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Users, Calendar, TrendingUp, Plus } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { getStageLabel } from "@/lib/applications/stages";
import type { ApplicationStage } from "@prisma/client";

interface DashboardData {
  organization: { id: string; name: string };
  openJobs: number;
  talentPoolCount: number;
  upcomingInterviews: number;
  pipelineHealthPercent: number;
  metrics: {
    candidatesReviewed: number;
    interviewsConducted: number;
    offersExtended: number;
  };
  pipelineHealth: { stage: string; count: number }[];
  recentApplications: {
    id: string;
    stage: ApplicationStage;
    candidateProfile: { user: { firstName: string; lastName: string } };
    job: { title: string } | null;
  }[];
}

export function RecruiterDashboard() {
  const t = useT();
  const d = t.recruiter.dashboard;
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruiter/dashboard")
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          setError(json.error ?? d.loadFailed);
          return;
        }
        setData(await res.json());
      })
      .finally(() => setLoading(false));
  }, [d.loadFailed]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.title}
        description={data.organization.name}
        action={
          <Button asChild>
            <Link href="/recruiter/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              {d.newJob}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={d.openJobs} value={data.openJobs} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title={d.talentPool} value={data.talentPoolCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title={d.upcomingInterviews} value={data.upcomingInterviews} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{d.pipelineHealth}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pipelineHealthPercent}%</div>
            <Progress value={data.pipelineHealthPercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title={d.candidatesReviewed} value={data.metrics.candidatesReviewed} />
        <StatCard title={d.interviewsConducted} value={data.metrics.interviewsConducted} />
        <StatCard title={d.offersExtended} value={data.metrics.offersExtended} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{d.pipelineBreakdown}</CardTitle>
            <CardDescription>{d.pipelineBreakdownDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pipelineHealth.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.noPipeline}</p>
            ) : (
              data.pipelineHealth.map((item) => (
                <div key={item.stage} className="flex justify-between text-sm">
                  <span>{getStageLabel(item.stage as ApplicationStage)}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{d.recentApplications}</CardTitle>
            <CardDescription>{d.recentApplicationsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.noApplications}</p>
            ) : (
              <div className="space-y-3">
                {data.recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">
                        {app.candidateProfile.user.firstName} {app.candidateProfile.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.job?.title}</p>
                    </div>
                    <Badge variant="outline">{getStageLabel(app.stage)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
