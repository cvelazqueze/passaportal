import type { JobAnalysisResult, MatchAnalysisResult } from "@/lib/candidate/job-analysis";

export function buildOpportunityNotesFromAnalysis(
  matchAnalysis: MatchAnalysisResult,
  analysis: JobAnalysisResult
): string {
  const lines = [
    `Match score: ${matchAnalysis.matchPercentage}%`,
  ];

  if (matchAnalysis.matchingSkills.length > 0) {
    lines.push(`Matching skills: ${matchAnalysis.matchingSkills.join(", ")}`);
  }
  if (matchAnalysis.missingSkills.length > 0) {
    lines.push(`Gaps: ${matchAnalysis.missingSkills.join(", ")}`);
  }
  if (analysis.experienceYears) {
    lines.push(`Experience required: ~${analysis.experienceYears}+ years`);
  }
  if (matchAnalysis.suggestions.length > 0) {
    lines.push("", "Suggestions:", ...matchAnalysis.suggestions.map((s) => `• ${s}`));
  }

  return lines.join("\n");
}

export function technologiesFromJobAnalysis(analysis: JobAnalysisResult): string[] {
  return Array.from(
    new Set([
      ...analysis.requiredSkills,
      ...analysis.preferredSkills,
      ...analysis.technologies,
    ])
  ).slice(0, 20);
}
