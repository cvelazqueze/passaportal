"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { translateInterviewType } from "@/lib/i18n/helpers";
import { INTERVIEW_TYPES } from "@/lib/recruiter/interview-schema";
import type { InterviewStatus, InterviewType } from "@prisma/client";

interface InterviewRow {
  id: string;
  applicationId: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  application: {
    candidateProfile: { user: { firstName: string; lastName: string } };
    job: { title: string } | null;
  };
}

interface ApplicationOption {
  id: string;
  label: string;
}

export function InterviewsHub() {
  const { t, locale } = useLocale();
  const i = t.recruiter.interviews;
  const dateLocale = locale === "es" ? "es-ES" : "en-US";
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [intRes, appRes] = await Promise.all([
      fetch("/api/recruiter/interviews"),
      fetch("/api/recruiter/applications"),
    ]);
    if (intRes.ok) {
      const json = await intRes.json();
      setInterviews(json.interviews ?? []);
    }
    if (appRes.ok) {
      const json = await appRes.json();
      setApplications(
        (json.applications ?? []).map(
          (a: {
            id: string;
            candidateProfile: { user: { firstName: string; lastName: string } };
            job: { title: string } | null;
          }) => ({
            id: a.id,
            label: `${a.candidateProfile.user.firstName} ${a.candidateProfile.user.lastName} — ${a.job?.title ?? i.application}`,
          })
        )
      );
    }
    setLoading(false);
  }, [i.application]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/recruiter/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: form.get("applicationId"),
        type: form.get("type"),
        scheduledAt: form.get("scheduledAt"),
        duration: Number(form.get("duration") || 60),
        meetingUrl: (form.get("meetingUrl") as string).trim() || null,
        notes: (form.get("notes") as string).trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? i.addFailed);
      setSubmitting(false);
      return;
    }
    setInterviews((prev) =>
      [...prev, json.interview].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    );
    setShowForm(false);
    setSubmitting(false);
  }

  async function markCompleted(id: string) {
    const interview = interviews.find((item) => item.id === id);
    if (!interview) return;
    const res = await fetch(`/api/recruiter/interviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: interview.applicationId,
        type: interview.type,
        scheduledAt: interview.scheduledAt.slice(0, 10),
        duration: interview.duration,
        meetingUrl: interview.meetingUrl,
        status: "COMPLETED",
      }),
    });
    if (res.ok) await load();
  }

  async function removeInterview(id: string) {
    if (!window.confirm(i.deleteConfirm)) return;
    const res = await fetch(`/api/recruiter/interviews/${id}`, { method: "DELETE" });
    if (res.ok) setInterviews((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        title={i.title}
        description={i.description}
        action={
          !showForm && applications.length > 0 ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {i.schedule}
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{i.schedule}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applicationId">{i.application}</Label>
                <select id="applicationId" name="applicationId" required className={selectClassName}>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">{i.date}</Label>
                  <Input id="scheduledAt" name="scheduledAt" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{i.type}</Label>
                  <select id="type" name="type" defaultValue="VIDEO" className={selectClassName}>
                    {INTERVIEW_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {translateInterviewType(type, t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">{i.duration}</Label>
                  <Input id="duration" name="duration" type="number" defaultValue={60} min={15} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingUrl">{i.meetingUrl}</Label>
                  <Input id="meetingUrl" name="meetingUrl" placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{i.notes}</Label>
                <Input id="notes" name="notes" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {i.schedule}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {applications.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{i.noApplications}</CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{i.noInterviews}</p>
        ) : (
          interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {interview.application.candidateProfile.user.firstName}{" "}
                    {interview.application.candidateProfile.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {interview.application.job?.title} ·{" "}
                    {new Date(interview.scheduledAt).toLocaleDateString(dateLocale)} ·{" "}
                    {translateInterviewType(interview.type, t)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{i.statuses[interview.status]}</Badge>
                  {interview.status === "SCHEDULED" && (
                    <Button size="sm" variant="outline" onClick={() => markCompleted(interview.id)}>
                      {i.markCompleted}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removeInterview(interview.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
