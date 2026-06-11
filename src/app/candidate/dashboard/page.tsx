import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader, StatCard } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  TrendingUp,
  Lightbulb,
  Target,
} from "lucide-react";
import { getCandidateAnalytics } from "@/lib/candidate/analytics";
import { generateCandidateInsights } from "@/lib/candidate/insights";
import { getServerDictionary } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n";
import {
  formatRelativeTimeLocalized,
  translatePipelineStage,
} from "@/lib/i18n/helpers";

export default async function CandidateDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      talentPassport: true,
      applications: {
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { pipelineStage: true },
      },
    },
  });

  if (!profile) redirect("/auth/login");

  const [analytics, insights] = await Promise.all([
    getCandidateAnalytics(profile.id),
    generateCandidateInsights(profile.id, locale),
  ]);

  const passport = profile.talentPassport;
  const completeness = passport?.completeness ?? 0;

  const upcomingInterviews = await db.candidateInterviewSession.findMany({
    where: {
      application: { candidateProfileId: profile.id },
      interviewDate: { gte: new Date() },
    },
    take: 3,
    orderBy: { interviewDate: "asc" },
    include: {
      application: { select: { title: true, company: true } },
    },
  });

  const activeOpportunities = profile.applications.filter((a) => {
    const stage = a.pipelineStage?.name.toLowerCase() ?? "";
    return !["rejected", "accepted", "ghosted", "withdrawn"].some((s) =>
      stage.includes(s)
    );
  }).length;

  const firstName = session.user.name?.split(" ")[0] ?? "";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={interpolate(t.dashboard.welcome, { name: firstName })}
          description={t.dashboard.subtitle}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={t.dashboard.profileCompleteness}
            value={`${completeness}%`}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title={t.dashboard.activeOpportunities}
            value={activeOpportunities}
            icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title={t.dashboard.interviewRate}
            value={`${analytics.applicationToInterviewRate}%`}
            description={t.dashboard.appsToInterviews}
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {completeness < 100 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">{t.dashboard.completeProfileTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.completeProfileDesc}
                </p>
                <Progress value={completeness} className="mt-3 w-48" />
              </div>
              <Button asChild>
                <Link href="/candidate/profile">{t.dashboard.completeProfileBtn}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t.dashboard.recentOpportunities}</CardTitle>
              <CardDescription>{t.dashboard.recentOpportunitiesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.dashboard.noOpportunities}
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{app.title ?? t.common.untitled}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.company} ·{" "}
                          {formatRelativeTimeLocalized(app.updatedAt, locale, t)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {app.pipelineStage?.name
                          ? translatePipelineStage(app.pipelineStage.name, t)
                          : t.common.unknown}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/candidate/opportunities">
                  {t.dashboard.viewAllOpportunities}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {t.dashboard.quickInsights}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/candidate/insights">{t.dashboard.viewAllInsights}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.dashboard.upcomingInterviews}</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.noneScheduled}</p>
              ) : (
                upcomingInterviews.map((i) => (
                  <div key={i.id} className="mb-2 text-sm">
                    <p className="font-medium">{i.application.title}</p>
                    <p className="text-muted-foreground">
                      {new Date(i.interviewDate).toLocaleDateString(
                        locale === "es" ? "es-ES" : "en-US"
                      )}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t.dashboard.jobWorkspace}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {t.dashboard.jobWorkspaceDesc}
              </p>
              <Button size="sm" asChild>
                <Link href="/candidate/jobs">{t.dashboard.analyzeJob}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.dashboard.searchHealth}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.dashboard.offers}</span>
                <span className="font-medium">{analytics.offers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.dashboard.rejections}</span>
                <span className="font-medium">{analytics.rejections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.dashboard.accepted}</span>
                <span className="font-medium">{analytics.accepted}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
