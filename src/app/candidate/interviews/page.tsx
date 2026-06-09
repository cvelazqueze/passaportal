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
import { Plus, Calendar, MessageSquare, Code } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function InterviewHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, t } = await getServerDictionary();
  const i = t.interviews;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/auth/login");

  const [sessions, assignments, opportunities] = await Promise.all([
    db.candidateInterviewSession.findMany({
      where: { application: { candidateProfileId: profile.id } },
      include: {
        application: { select: { title: true, company: true } },
        questions: true,
      },
      orderBy: { interviewDate: "desc" },
    }),
    db.takeHomeAssignment.findMany({
      where: { application: { candidateProfileId: profile.id } },
      include: { application: { select: { title: true, company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.application.findMany({
      where: { candidateProfileId: profile.id },
      select: { id: true, title: true, company: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const technicalQuestions = sessions.flatMap((s) =>
    s.questions.filter((q) => q.questionType === "TECHNICAL")
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={i.title}
          description={i.description}
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {i.logInterview}
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{i.totalInterviews}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{i.technicalQuestions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicalQuestions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{i.takeHomeAssignments}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{i.sessions}</CardTitle>
            <CardDescription>{i.sessionsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{i.noSessions}</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {session.application.title} — {session.application.company}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.interviewDate).toLocaleDateString(dateLocale)}
                          {session.interviewer && ` · ${session.interviewer}`}
                        </p>
                      </div>
                      <Badge variant="secondary">{session.interviewType}</Badge>
                    </div>
                    {session.outcome && (
                      <p className="mt-2 text-sm">
                        {i.outcome}: {session.outcome}
                      </p>
                    )}
                    {session.lessonsLearned && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <MessageSquare className="inline h-3 w-3 mr-1" />
                        {session.lessonsLearned}
                      </p>
                    )}
                    {session.questions.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        <Badge variant="outline">
                          <Code className="mr-1 h-3 w-3" />
                          {session.questions.filter((q) => q.questionType === "TECHNICAL").length}{" "}
                          {i.technical}
                        </Badge>
                        <Badge variant="outline">
                          {session.questions.filter((q) => q.questionType === "BEHAVIORAL").length}{" "}
                          {i.behavioral}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{i.takeHome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.application.title} — {a.application.company}
                  </p>
                  {a.submittedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {i.submittedLabel}:{" "}
                      {new Date(a.submittedAt).toLocaleDateString(dateLocale)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{i.linkOpportunity}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {i.linkOpportunityDesc}
              </p>
              <div className="flex flex-wrap gap-2">
                {opportunities.map((o) => (
                  <Badge key={o.id} variant="outline">
                    {o.title} @ {o.company}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
