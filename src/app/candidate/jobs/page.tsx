"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, FileText } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";

interface WorkspaceResult {
  workspace: { id: string; jobTitle: string; company: string };
  analysis: {
    requiredSkills: string[];
    preferredSkills: string[];
    technologies: string[];
    certifications: string[];
    experienceYears: number | null;
  };
  matchAnalysis: {
    matchingSkills: string[];
    missingSkills: string[];
    suggestions: string[];
    matchPercentage: number;
  };
}

export default function JobWorkspacePage() {
  const t = useT();
  const j = t.jobs;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkspaceResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      jobTitle: formData.get("jobTitle") as string,
      company: formData.get("company") as string,
      description: formData.get("description") as string,
    };

    try {
      const res = await fetch("/api/candidate/job-workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? j.analysisFailed);
        return;
      }
      setResult(json);
    } catch {
      setError(j.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={j.title} description={j.description} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {j.analyzeTitle}
            </CardTitle>
            <CardDescription>{j.analyzeDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">{j.jobTitle}</Label>
                  <Input id="jobTitle" name="jobTitle" placeholder={j.titlePlaceholder} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{j.company}</Label>
                  <Input id="company" name="company" placeholder={j.companyPlaceholder} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{j.jobDescription}</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  required
                  minLength={20}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={j.descriptionPlaceholder}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? j.analyzing : j.analyzeMatch}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {result.workspace.jobTitle} {t.common.at} {result.workspace.company}
                </CardTitle>
                <CardDescription>{j.extractedRequirements}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{j.matchScore}</p>
                  <div className="flex items-center gap-3">
                    <Progress value={result.matchAnalysis.matchPercentage} className="flex-1" />
                    <span className="font-bold">{result.matchAnalysis.matchPercentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{j.requiredSkills}</p>
                  <div className="flex flex-wrap gap-1">
                    {result.analysis.requiredSkills.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
                {result.analysis.preferredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{j.preferredSkills}</p>
                    <div className="flex flex-wrap gap-1">
                      {result.analysis.preferredSkills.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {result.analysis.experienceYears && (
                  <p className="text-sm text-muted-foreground">
                    {interpolate(j.experienceRequired, {
                      years: result.analysis.experienceYears,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{j.matchAnalysis}</CardTitle>
                <CardDescription>{j.profileVsJob}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2 text-success">{j.matchingSkills}</p>
                  <div className="flex flex-wrap gap-1">
                    {result.matchAnalysis.matchingSkills.length > 0 ? (
                      result.matchAnalysis.matchingSkills.map((s) => (
                        <Badge key={s} className="bg-success/10 text-success border-success/20">{s}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{j.noMatches}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-destructive">{j.missingSkills}</p>
                  <div className="flex flex-wrap gap-1">
                    {result.matchAnalysis.missingSkills.length > 0 ? (
                      result.matchAnalysis.missingSkills.map((s) => (
                        <Badge key={s} variant="destructive">{s}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{j.allSkillsMatch}</p>
                    )}
                  </div>
                </div>
                {result.matchAnalysis.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{j.suggestions}</p>
                    <ul className="space-y-1">
                      {result.matchAnalysis.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  {j.generateResume}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{j.savedAnalyses}</CardTitle>
            <CardDescription>{j.savedAnalysesDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{j.noSavedAnalyses}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
