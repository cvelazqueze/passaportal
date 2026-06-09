import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateCandidateInsights } from "@/lib/candidate/insights";
import { Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";

const priorityColors = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-success/30 bg-success/5",
};

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const insights = await generateCandidateInsights(profile.id, locale);
  const highPriority = insights.filter((i) => i.priority === "high");
  const others = insights.filter((i) => i.priority !== "high");

  const strategyLinks = [
    {
      href: "/candidate/profile",
      label: t.insightsPage.completeProfile,
      desc: t.insightsPage.completeProfileDesc,
    },
    {
      href: "/candidate/jobs",
      label: t.insightsPage.analyzeJobs,
      desc: t.insightsPage.analyzeJobsDesc,
    },
    {
      href: "/candidate/resumes",
      label: t.insightsPage.createResumes,
      desc: t.insightsPage.createResumesDesc,
    },
    {
      href: "/candidate/rejections",
      label: t.insightsPage.logRejections,
      desc: t.insightsPage.logRejectionsDesc,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t.insightsPage.title}
          description={t.insightsPage.description}
        />

        {highPriority.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-destructive">
              {t.insightsPage.actionRequired}
            </h3>
            <div className="space-y-3">
              {highPriority.map((insight) => (
                <Card key={insight.id} className={priorityColors.high}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{insight.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {t.insightsPage.types[insight.type]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t.insightsPage.allInsights}
          </h3>
          <div className="space-y-3">
            {others.map((insight) => (
              <Card key={insight.id} className={priorityColors[insight.priority]}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{insight.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {t.insightsPage.types[insight.type]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {t.insightsPage.priority[insight.priority]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.insightsPage.improveStrategy}</CardTitle>
            <CardDescription>{t.insightsPage.improveStrategyDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {strategyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
