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
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown } from "lucide-react";
import { getRejectionInsights } from "@/lib/candidate/analytics";
import { getServerDictionary } from "@/lib/i18n/server";
import { translatePipelineStage } from "@/lib/i18n/helpers";

export default async function RejectionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();
  const r = t.rejections;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const insights = await getRejectionInsights(profile.id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={r.title}
          description={r.description}
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {r.logRejection}
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{r.totalRejections}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{r.mostCommonStage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {insights.byStage[0]?.stage
                  ? translatePipelineStage(insights.byStage[0].stage, t)
                  : t.common.empty}
              </div>
              {insights.byStage[0] && (
                <p className="text-xs text-muted-foreground">
                  {insights.byStage[0].count} {t.common.occurrences}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{r.topReason}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {insights.byReason[0]?.reason ?? t.common.empty}
              </div>
              {insights.byReason[0] && (
                <p className="text-xs text-muted-foreground">
                  {insights.byReason[0].count} {t.common.times}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {r.byStage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.byStage.length === 0 ? (
                <p className="text-sm text-muted-foreground">{r.noStageData}</p>
              ) : (
                <div className="space-y-3">
                  {insights.byStage.map((item) => (
                    <div key={item.stage} className="flex items-center justify-between">
                      <span className="text-sm">
                        {translatePipelineStage(item.stage, t)}
                      </span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{r.reasons}</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.byReason.length === 0 ? (
                <p className="text-sm text-muted-foreground">{r.reasonsDesc}</p>
              ) : (
                <div className="space-y-3">
                  {insights.byReason.map((item) => (
                    <div key={item.reason} className="flex items-center justify-between">
                      <span className="text-sm">{item.reason}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{r.recent}</CardTitle>
            <CardDescription>{r.recentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{r.noRejections}</p>
            ) : (
              <div className="space-y-3">
                {insights.recent.map((rej) => (
                  <div key={rej.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {rej.application.title} — {rej.application.company}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rej.rejectedAt).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-2">
                      {rej.stageName && (
                        <Badge variant="outline">
                          {translatePipelineStage(rej.stageName, t)}
                        </Badge>
                      )}
                      {rej.reason && <Badge variant="secondary">{rej.reason.label}</Badge>}
                    </div>
                    {rej.candidateNotes && (
                      <p className="mt-2 text-sm text-muted-foreground">{rej.candidateNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
