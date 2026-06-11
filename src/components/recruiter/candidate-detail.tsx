"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { getStageLabel } from "@/lib/applications/stages";
import type { ApplicationStage } from "@prisma/client";

interface JobScore {
  jobId: string;
  jobTitle: string;
  score: { percentage: number };
}

export function CandidateDetail({ id }: { id: string }) {
  const t = useT();
  const c = t.recruiter.candidates;
  const [data, setData] = useState<{
    candidate: {
      user: { firstName: string; lastName: string; email: string };
      talentPassport: {
        professionalTitle: string | null;
        professionalSummary: string | null;
        technologies: string[];
        skills: { name: string; proficiency: string }[];
        experiences: { company: string; position: string; isCurrent: boolean }[];
        education: { institution: string; degree: string }[];
      } | null;
      applications: { id: string; stage: ApplicationStage; job: { title: string } | null }[];
      talentPoolMembers: { talentPool: { name: string } }[];
    };
    jobScores: JobScore[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/recruiter/candidates/${id}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (!data?.candidate) {
    return <p className="text-sm text-muted-foreground">{c.notFound}</p>;
  }

  const { candidate, jobScores } = data;
  const passport = candidate.talentPassport;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="pl-0">
        <Link href="/recruiter/candidates">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {c.backToList}
        </Link>
      </Button>

      <div>
        <h2 className="text-2xl font-bold">
          {candidate.user.firstName} {candidate.user.lastName}
        </h2>
        <p className="text-muted-foreground">
          {passport?.professionalTitle ?? candidate.user.email}
        </p>
      </div>

      {passport?.professionalSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{c.summary}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{passport.professionalSummary}</CardContent>
        </Card>
      )}

      {jobScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{c.jobFit}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {jobScores.map((js) => (
              <div key={js.jobId} className="flex justify-between text-sm">
                <span>{js.jobTitle}</span>
                <Badge variant="secondary">{js.score.percentage}% {c.match}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {candidate.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{c.applications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidate.applications.map((app) => (
              <div key={app.id} className="flex justify-between text-sm">
                <span>{app.job?.title}</span>
                <Badge variant="outline">{getStageLabel(app.stage)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {passport && (
        <>
          {passport.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{c.skills}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {passport.skills.map((s) => (
                  <Badge key={s.name} variant="outline">
                    {s.name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
          {passport.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{c.experience}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {passport.experiences.map((exp, i) => (
                  <div key={i}>
                    <p className="font-medium">{exp.position} @ {exp.company}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
