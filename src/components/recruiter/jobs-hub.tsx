"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { JobForm, type RecruiterJob } from "@/components/recruiter/job-form";
import { APPLICATION_STAGES, getStageLabel } from "@/lib/applications/stages";
import type { ApplicationStage } from "@prisma/client";

interface ApplicationRow {
  id: string;
  stage: ApplicationStage;
  candidateProfile: {
    id: string;
    user: { firstName: string; lastName: string };
  };
}

export function JobsHub({ initialShowForm = false }: { initialShowForm?: boolean }) {
  const t = useT();
  const j = t.recruiter.jobs;
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/recruiter/jobs");
    if (res.ok) {
      const json = await res.json();
      setJobs(json.jobs ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const editingJob = editingId ? jobs.find((job) => job.id === editingId) : undefined;

  async function loadApplications(jobId: string) {
    const res = await fetch(`/api/recruiter/applications?jobId=${jobId}`);
    if (res.ok) {
      const json = await res.json();
      setApplications(json.applications ?? []);
    }
  }

  async function updateStage(applicationId: string, stage: ApplicationStage) {
    const res = await fetch(`/api/recruiter/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok && expandedJobId) {
      await loadApplications(expandedJobId);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.title}
        description={j.description}
        action={
          !showForm && !editingId ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {j.newJob}
            </Button>
          ) : undefined
        }
      />

      {(showForm || editingId) && (
        <JobForm
          mode={editingId ? "edit" : "add"}
          initial={editingJob}
          onSuccess={(job) => {
            setJobs((prev) => {
              const idx = prev.findIndex((item) => item.id === job.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = job;
                return next;
              }
              return [job, ...prev];
            });
            closeForm();
          }}
          onCancel={closeForm}
          onDelete={
            editingId
              ? () => {
                  setJobs((prev) => prev.filter((item) => item.id !== editingId));
                  closeForm();
                }
              : undefined
          }
        />
      )}

      {jobs.length === 0 && !showForm ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{j.noJobs}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">{j.statuses[job.status]}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(job.id);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {job.remote && <Badge variant="outline">{j.remote}</Badge>}
                  {job.location && <span>{job.location}</span>}
                  <span>
                    {job._count?.applications ?? 0} {j.applications}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const next = expandedJobId === job.id ? null : job.id;
                    setExpandedJobId(next);
                    if (next) await loadApplications(next);
                  }}
                >
                  {expandedJobId === job.id ? j.hidePipeline : j.viewPipeline}
                </Button>
                {expandedJobId === job.id && (
                  <div className="space-y-2 border-t pt-3">
                    {applications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{j.noApplications}</p>
                    ) : (
                      applications.map((app) => (
                        <div key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
                          <Link
                            href={`/recruiter/candidates/${app.candidateProfile.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {app.candidateProfile.user.firstName} {app.candidateProfile.user.lastName}
                          </Link>
                          <select
                            value={app.stage}
                            onChange={(e) => updateStage(app.id, e.target.value as ApplicationStage)}
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {APPLICATION_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {getStageLabel(s.id)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
