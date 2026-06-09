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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCandidateAnalytics } from "@/lib/candidate/analytics";
import {
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  XCircle,
  Ghost,
} from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n";

function formatSalary(amount: number | null, locale: string) {
  if (!amount) return "—";
  const tag = locale === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();
  const a = t.analytics;

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const analytics = await getCandidateAnalytics(profile.id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={a.title} description={a.description} />

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {a.activityMetrics}
          </h3>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard title={a.applications} value={analytics.applicationsSubmitted} icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title={a.interviews} value={analytics.interviews} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title={a.technical} value={analytics.technicalInterviews} />
            <StatCard title={a.offers} value={analytics.offers} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title={a.rejections} value={analytics.rejections} icon={<XCircle className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title={a.ghosted} value={analytics.ghosted} icon={<Ghost className="h-4 w-4 text-muted-foreground" />} />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {a.conversionFunnel}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{a.appToInterview}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.applicationToInterviewRate}%</div>
                <Progress value={analytics.applicationToInterviewRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{a.interviewToOffer}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.interviewToOfferRate}%</div>
                <Progress value={analytics.interviewToOfferRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{a.offerToAccepted}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.offerToAcceptanceRate}%</div>
                <Progress value={analytics.offerToAcceptanceRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {a.salaryMetrics}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">{a.appliedRange}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{a.avg}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryApplied.avg, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{a.min}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryApplied.min, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{a.max}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryApplied.max, locale)}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">{a.offeredRange}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{a.avg}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryOffered.avg, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{a.min}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryOffered.min, locale)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{a.max}</p>
                    <p className="font-medium">{formatSalary(analytics.salaryOffered.max, locale)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {a.topTechnologies}
              </CardTitle>
              <CardDescription>{a.topTechnologiesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topTechnologies.length === 0 ? (
                <p className="text-sm text-muted-foreground">{a.noTechData}</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topTechnologies.map((tech) => (
                    <div key={tech.name} className="flex items-center justify-between">
                      <Badge variant="outline">{tech.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {interpolate(a.opportunitiesCount, { count: tech.count })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
