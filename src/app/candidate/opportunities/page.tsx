"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/candidate/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Settings2 } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { translatePipelineStage } from "@/lib/i18n/helpers";
import {
  OpportunityForm,
  type Opportunity,
} from "@/components/candidate/opportunity-form";
import {
  PipelineSetup,
  AddPipelineColumn,
} from "@/components/candidate/pipeline-setup";
import { PipelineSettings } from "@/components/candidate/pipeline-settings";
import type { WorkArrangement } from "@prisma/client";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isArchived?: boolean;
}

export default function OpportunitiesPage() {
  const t = useT();
  const o = t.opportunities;
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPipelineSettings, setShowPipelineSettings] = useState(false);

  const activeStages = stages.filter((s) => !s.isArchived);
  const editingOpportunity = editingId
    ? opportunities.find((opp) => opp.id === editingId)
    : undefined;

  const loadOpportunities = useCallback(async () => {
    const res = await fetch("/api/candidate/opportunities");
    const data = await res.json();
    if (res.ok) {
      setStages(data.stages ?? []);
      setOpportunities(data.opportunities ?? []);
    }
  }, []);

  useEffect(() => {
    loadOpportunities().finally(() => setLoading(false));
  }, [loadOpportunities]);

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

  function handleOpportunitySaved(opportunity: Opportunity) {
    setOpportunities((prev) => {
      const exists = prev.some((opp) => opp.id === opportunity.id);
      if (exists) {
        return prev.map((opp) =>
          opp.id === opportunity.id ? { ...opp, ...opportunity } : opp
        );
      }
      return [opportunity, ...prev];
    });
    setShowAddForm(false);
    setEditingId(null);
  }

  function handleOpportunityDeleted() {
    if (!editingId) return;
    setOpportunities((prev) => prev.filter((opp) => opp.id !== editingId));
    setEditingId(null);
  }

  function workTypeLabel(type: WorkArrangement): string {
    return o.workTypes[type];
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{o.loading}</p>
      </DashboardLayout>
    );
  }

  const hasPipeline = activeStages.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={o.title}
          description={o.description}
          action={
            <div className="flex flex-wrap gap-2">
              {hasPipeline && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowPipelineSettings((v) => !v)}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    {o.managePipeline}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      setShowAddForm((open) => !open);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {o.addOpportunity}
                  </Button>
                </>
              )}
            </div>
          }
        />

        {!hasPipeline && <PipelineSetup onStageAdded={loadOpportunities} />}

        {hasPipeline && showAddForm && (
          <OpportunityForm
            mode="add"
            stages={activeStages}
            onSuccess={handleOpportunitySaved}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {editingOpportunity && (
          <OpportunityForm
            mode="edit"
            stages={activeStages}
            initial={editingOpportunity}
            onSuccess={handleOpportunitySaved}
            onCancel={() => setEditingId(null)}
            onDelete={handleOpportunityDeleted}
          />
        )}

        {hasPipeline && (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 scroll-smooth">
            {activeStages.map((stage) => {
              const stageOpps = opportunities.filter(
                (opp) => opp.pipelineStageId === stage.id
              );
              return (
                <div
                  key={stage.id}
                  className="w-[min(85vw,260px)] shrink-0 snap-start sm:w-[260px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {translatePipelineStage(stage.name, t)}
                    </h3>
                    <Badge variant="secondary">{stageOpps.length}</Badge>
                  </div>
                  <div
                    className={`space-y-2 min-h-[180px] rounded-lg border-2 border-dashed p-3 ${stage.color}`}
                  >
                    {stageOpps.length === 0 && (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        {o.emptyStage}
                      </p>
                    )}
                    {stageOpps.map((opp) => (
                      <Card
                        key={opp.id}
                        draggable
                        onDragStart={() => setDraggedId(opp.id)}
                        className="cursor-grab bg-card active:cursor-grabbing"
                      >
                        <CardHeader className="flex flex-row items-start justify-between gap-1 p-3 pb-1">
                          <CardTitle className="text-sm leading-snug">
                            {opp.title ?? t.common.untitled}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAddForm(false);
                              setEditingId(opp.id);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">{o.editOpportunity}</span>
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-1 p-3 pt-0">
                          {opp.company && (
                            <p className="text-xs text-muted-foreground">{opp.company}</p>
                          )}
                          {opp.client && (
                            <p className="text-xs text-muted-foreground">
                              {o.client}: {opp.client}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {opp.workType && (
                              <Badge variant="secondary" className="text-xs">
                                {workTypeLabel(opp.workType)}
                              </Badge>
                            )}
                            {opp.contractType && (
                              <Badge variant="outline" className="text-xs">
                                {opp.contractType}
                              </Badge>
                            )}
                          </div>
                          {opp.technologies.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {opp.technologies.slice(0, 2).map((tech) => (
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
            <AddPipelineColumn onStageAdded={loadOpportunities} />
          </div>
        )}

        {hasPipeline && showPipelineSettings && (
          <PipelineSettings onStagesChange={loadOpportunities} />
        )}
      </div>
    </DashboardLayout>
  );
}
