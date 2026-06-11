"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/components/locale-provider";
import { getStageLabel } from "@/lib/applications/stages";
import type { ApplicationStage } from "@prisma/client";

interface CandidateRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  professionalTitle: string | null;
  technologies: string[];
  completeness: number;
  location: string | null;
  applications: { id: string; jobTitle: string | null; stage: string }[];
  pools: string[];
}

export function CandidatesHub() {
  const t = useT();
  const c = t.recruiter.candidates;
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/recruiter/candidates");
    if (res.ok) {
      const json = await res.json();
      setCandidates(json.candidates ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description={c.description} />
      {candidates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">{c.noCandidates}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {candidates.map((candidate) => (
            <Link key={candidate.id} href={`/recruiter/candidates/${candidate.id}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-medium">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.professionalTitle ?? candidate.email}
                    </p>
                    {candidate.location && (
                      <p className="text-xs text-muted-foreground mt-1">{candidate.location}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{c.profileCompleteness}</span>
                      <span>{candidate.completeness}%</span>
                    </div>
                    <Progress value={candidate.completeness} />
                  </div>
                  {candidate.applications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {candidate.applications.slice(0, 2).map((app) => (
                        <Badge key={app.id} variant="outline" className="text-xs">
                          {app.jobTitle ?? c.application} · {getStageLabel(app.stage as ApplicationStage)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {candidate.pools.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {c.pools}: {candidate.pools.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
