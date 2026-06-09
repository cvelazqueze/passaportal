import { ApplicationStage } from "@prisma/client";

export const APPLICATION_STAGES: {
  id: ApplicationStage;
  label: string;
  color: string;
}[] = [
  { id: "INTERESTED", label: "Interested", color: "bg-slate-100" },
  { id: "APPLIED", label: "Applied", color: "bg-blue-100" },
  { id: "RECRUITER_CONTACTED", label: "Recruiter Contacted", color: "bg-indigo-100" },
  { id: "SCREENING", label: "Screening", color: "bg-purple-100" },
  { id: "TECHNICAL_INTERVIEW", label: "Technical Interview", color: "bg-violet-100" },
  { id: "HIRING_MANAGER_INTERVIEW", label: "HM Interview", color: "bg-amber-100" },
  { id: "FINAL_INTERVIEW", label: "Final Interview", color: "bg-orange-100" },
  { id: "OFFER", label: "Offer", color: "bg-green-100" },
  { id: "ACCEPTED", label: "Accepted", color: "bg-emerald-100" },
  { id: "REJECTED", label: "Rejected", color: "bg-red-100" },
];

export function getStageLabel(stage: ApplicationStage): string {
  return APPLICATION_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function getStageColor(stage: ApplicationStage): string {
  return APPLICATION_STAGES.find((s) => s.id === stage)?.color ?? "bg-gray-100";
}

export function getNextStages(current: ApplicationStage): ApplicationStage[] {
  const stageOrder = APPLICATION_STAGES.map((s) => s.id);
  const currentIndex = stageOrder.indexOf(current);
  if (currentIndex === -1) return [];

  const next = stageOrder.slice(currentIndex + 1);
  return next.filter((s) => s !== "REJECTED");
}
