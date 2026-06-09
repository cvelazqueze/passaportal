"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { translatePipelineStage } from "@/lib/i18n/helpers";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface Opportunity {
  id: string;
  title: string | null;
  company: string | null;
  pipelineStageId: string | null;
  pipelineStage: PipelineStage | null;
  salaryMin: number | null;
  salaryMax: number | null;
  technologies: string[];
  source: string | null;
}

export default function OpportunitiesPage() {
  const t = useT();
  const o = t.opportunities;
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/candidate/opportunities")
      .then((r) => r.json())
      .then((data) => {
        setStages(
          (data.stages ?? []).filter(
            (s: PipelineStage & { isArchived?: boolean }) =>
              !["Accepted", "Rejected", "Ghosted", "Withdrawn"].includes(s.name)
          )
        );
        setOpportunities(data.opportunities ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDrop(stageId: string) {
    if (!draggedId) return;
    const res = await fetch(`/api/candidate/opportunities/${draggedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStageId: stageId }),
    });
    if (res.ok) {
      const { opportunity } = await res.json();
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === draggedId ? { ...opp, ...opportunity } : opp))
      );
    }
    setDraggedId(null);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{o.loading}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={o.title}
          description={o.description}
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {o.addOpportunity}
            </Button>
          }
        />

        {stages.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{o.noStages}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageOpps = opportunities.filter(
                (opp) => opp.pipelineStageId === stage.id
              );
              return (
                <div
                  key={stage.id}
                  className="min-w-[260px] flex-shrink-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {translatePipelineStage(stage.name, t)}
                    </h3>
                    <Badge variant="secondary">{stageOpps.length}</Badge>
                  </div>
                  <div
                    className={`space-y-2 min-h-[180px] rounded-lg border-2 border-dashed p-3 ${stage.color}`}
                  >
                    {stageOpps.map((opp) => (
                      <Card
                        key={opp.id}
                        draggable
                        onDragStart={() => setDraggedId(opp.id)}
                        className="cursor-grab active:cursor-grabbing bg-card"
                      >
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm">
                            {opp.title ?? t.common.untitled}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xs text-muted-foreground">
                            {opp.company}
                          </p>
                          {opp.technologies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {opp.technologies.slice(0, 3).map((tech) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{o.pipelineSettings}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{o.pipelineSettingsDesc}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
