"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { Plus, Calendar, MessageSquare, Code, Pencil } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { translateInterviewType } from "@/lib/i18n/helpers";
import {
  InterviewSessionForm,
  type InterviewSession,
  type OpportunityOption,
} from "@/components/candidate/interview-session-form";

interface TakeHomeAssignment {
  id: string;
  title: string;
  submittedAt: string | null;
  application: { title: string | null; company: string | null };
}

export function InterviewHub() {
  const { t, locale } = useLocale();
  const i = t.interviews;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [assignments, setAssignments] = useState<TakeHomeAssignment[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [interviewsRes, opportunitiesRes] = await Promise.all([
      fetch("/api/candidate/interviews"),
      fetch("/api/candidate/opportunities"),
    ]);

    if (interviewsRes.ok) {
      const json = await interviewsRes.json();
      setSessions(json.sessions ?? []);
      setAssignments(json.assignments ?? []);
    }

    if (opportunitiesRes.ok) {
      const json = await opportunitiesRes.json();
      setOpportunities(
        (json.opportunities ?? []).map(
          (o: { id: string; title: string | null; company: string | null }) => ({
            id: o.id,
            title: o.title,
            company: o.company,
          })
        )
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  const technicalQuestions = sessions.flatMap((s) =>
    s.questions.filter((q) => q.questionType === "TECHNICAL")
  );

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleSessionSaved(session: InterviewSession) {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = session;
        return next.sort(
          (a, b) =>
            new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
        );
      }
      return [session, ...prev].sort(
        (a, b) =>
          new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
      );
    });
    closeForm();
  }

  function handleSessionDeleted() {
    if (!editingId) return;
    setSessions((prev) => prev.filter((s) => s.id !== editingId));
    closeForm();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={i.title}
        description={i.description}
        action={
          !showForm && !editingId ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {i.logInterview}
            </Button>
          ) : undefined
        }
      />

      {(showForm || editingId) && (
        <InterviewSessionForm
          mode={editingId ? "edit" : "add"}
          opportunities={opportunities}
          initial={editingSession}
          onSuccess={handleSessionSaved}
          onCancel={closeForm}
          onDelete={editingId ? handleSessionDeleted : undefined}
        />
      )}

      {opportunities.length === 0 && !showForm && !editingId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{i.noOpportunitiesDesc}</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0">
              <Link href="/candidate/opportunities">{i.addOpportunityFirst}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
              {sessions.map((session) => {
                const technical = session.questions.filter(
                  (q) => q.questionType === "TECHNICAL"
                );
                const behavioral = session.questions.filter(
                  (q) => q.questionType === "BEHAVIORAL"
                );

                return (
                  <div key={session.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {session.application.title}
                          {session.application.company
                            ? ` — ${session.application.company}`
                            : ""}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(session.interviewDate).toLocaleDateString(dateLocale)}
                          {session.interviewer && ` · ${session.interviewer}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">
                          {translateInterviewType(session.interviewType, t)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setShowForm(false);
                            setEditingId(session.id);
                          }}
                          aria-label={i.editInterview}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
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
                    {session.notes && (
                      <p className="mt-1 text-sm text-muted-foreground">{session.notes}</p>
                    )}

                    {session.questions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          {technical.length > 0 && (
                            <Badge variant="outline">
                              <Code className="mr-1 h-3 w-3" />
                              {technical.length} {i.technical}
                            </Badge>
                          )}
                          {behavioral.length > 0 && (
                            <Badge variant="outline">
                              {behavioral.length} {i.behavioral}
                            </Badge>
                          )}
                        </div>
                        {technical.length > 0 && (
                          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {technical.map((q) => (
                              <li key={q.id}>{q.question}</li>
                            ))}
                          </ul>
                        )}
                        {behavioral.length > 0 && (
                          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {behavioral.map((q) => (
                              <li key={q.id}>{q.question}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                  {a.application.title}
                  {a.application.company ? ` — ${a.application.company}` : ""}
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
    </div>
  );
}
