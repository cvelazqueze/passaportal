import type { Locale } from "./types";
import { getDictionary } from "./index";
import { translatePipelineStage } from "./helpers";
import type { CandidateInsight } from "@/lib/candidate/insights";

export function buildInsightMessages(
  locale: Locale,
  data: {
    applicationToInterviewRate: number;
    topTech?: { name: string; count: number };
    topRejectionStage?: { stage: string; count: number };
    topRejectionReason?: { reason: string; count: number };
    responseRate: number;
    resumeVersionCount: number;
    salaryAppliedAvg?: number;
    salaryOfferedAvg?: number;
  }
) {
  const t = getDictionary(locale);
  const stageLabel = (name: string) => translatePipelineStage(name, t);
  const insights: CandidateInsight[] = [];

  if (data.applicationToInterviewRate > 0) {
    const rate = data.applicationToInterviewRate;
    insights.push({
      id: "conversion-rate",
      type: "general",
      title: locale === "es" ? "Conversión de postulaciones" : "Application conversion",
      description:
        locale === "es"
          ? `${rate}% de tus postulaciones llevan a entrevistas. El promedio de la industria es ~10-15%.`
          : `${rate}% of your applications lead to interviews. Industry average is ~10-15%.`,
      priority: rate >= 15 ? "low" : "high",
    });
  }

  if (data.topTech) {
    const { name, count } = data.topTech;
    insights.push({
      id: "top-tech",
      type: "technology",
      title:
        locale === "es"
          ? `${name} es tu tecnología más postulada`
          : `${name} is your most applied technology`,
      description:
        locale === "es"
          ? `Has postulado a ${count} oportunidades que mencionan ${name}. Enfoca tu búsqueda en roles con esta habilidad.`
          : `You've applied to ${count} opportunities mentioning ${name}. Focus your search on roles emphasizing this skill.`,
      priority: "medium",
    });
  }

  if (data.topRejectionStage) {
    const { stage, count } = data.topRejectionStage;
    const translatedStage = stageLabel(stage);
    insights.push({
      id: "rejection-stage",
      type: "rejection",
      title:
        locale === "es"
          ? `La mayoría de rechazos ocurren en "${translatedStage}"`
          : `Most rejections happen at "${translatedStage}"`,
      description:
        locale === "es"
          ? `${count} de tus rechazos ocurrieron en esta etapa. Considera preparación extra para esta fase.`
          : `${count} of your rejections occurred at this stage. Consider extra preparation for this phase.`,
      priority: "high",
    });
  }

  if (data.topRejectionReason) {
    const { reason, count } = data.topRejectionReason;
    insights.push({
      id: "rejection-reason",
      type: "rejection",
      title:
        locale === "es"
          ? `Razón común de rechazo: ${reason}`
          : `Common rejection reason: ${reason}`,
      description:
        locale === "es"
          ? `Esta razón apareció ${count} veces. Aborda este patrón en futuras postulaciones.`
          : `This reason appeared ${count} times. Address this pattern in future applications.`,
      priority: "high",
    });
  }

  if (data.responseRate >= 0) {
    insights.push({
      id: "response-timing",
      type: "timing",
      title: locale === "es" ? "Patrón de tiempos de respuesta" : "Response timing pattern",
      description:
        locale === "es"
          ? `${data.responseRate}% de tus oportunidades muestran progreso en los primeros 7 días.`
          : `${data.responseRate}% of your opportunities show progress within 7 days of applying.`,
      priority: "medium",
    });
  }

  if (data.resumeVersionCount > 0) {
    const n = data.resumeVersionCount;
    insights.push({
      id: "resume-versions",
      type: "resume",
      title:
        locale === "es"
          ? `${n} versión${n > 1 ? "es" : ""} de currículum adaptada${n > 1 ? "s" : ""}`
          : `${n} tailored resume version${n > 1 ? "s" : ""}`,
      description:
        locale === "es"
          ? "Mantén versiones específicas por rol para mejorar el match. Usa el Espacio de empleos para adaptar cada postulación."
          : "Maintain role-specific resume versions to improve match rates. Use Job Workspace to tailor for each application.",
      priority: "medium",
    });
  }

  if (data.salaryAppliedAvg && data.salaryOfferedAvg) {
    const diff = data.salaryOfferedAvg - data.salaryAppliedAvg;
    const fmt = (n: number) => n.toLocaleString(locale === "es" ? "es-ES" : "en-US");
    insights.push({
      id: "salary-gap",
      type: "salary",
      title:
        locale === "es"
          ? "Expectativas salariales vs ofertas"
          : "Salary expectations vs offers",
      description:
        diff >= 0
          ? locale === "es"
            ? `Tu oferta promedio ($${fmt(data.salaryOfferedAvg)}) cumple o supera tu rango postulado.`
            : `Your average offer ($${fmt(data.salaryOfferedAvg)}) meets or exceeds your applied range.`
          : locale === "es"
            ? `Las ofertas promedian $${fmt(Math.abs(diff))} por debajo de tu rango. Considera ajustar expectativas o buscar roles mejor pagados.`
            : `Offers average $${fmt(Math.abs(diff))} below your applied salary range. Consider adjusting expectations or targeting higher-paying roles.`,
      priority: diff < 0 ? "high" : "low",
    });
  }

  return insights;
}
