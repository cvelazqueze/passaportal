import { describe, expect, it } from "vitest";
import type { JobAnalysisResult, MatchAnalysisResult } from "@/lib/candidate/job-analysis";
import {
  buildOpportunityNotesFromAnalysis,
  technologiesFromJobAnalysis,
} from "@/lib/candidate/job-workspace-opportunity";

describe("job-workspace-opportunity", () => {
  it("builds notes from analysis", () => {
    const analysis: JobAnalysisResult = {
      requiredSkills: ["typescript"],
      preferredSkills: ["react"],
      technologies: ["node.js"],
      certifications: [],
      experienceYears: 5,
      keywords: [],
    };
    const matchAnalysis: MatchAnalysisResult = {
      matchingSkills: ["typescript"],
      missingSkills: ["react"],
      matchingTechnologies: [],
      missingTechnologies: [],
      suggestions: ["Highlight experience with: react"],
      matchPercentage: 50,
    };

    const notes = buildOpportunityNotesFromAnalysis(matchAnalysis, analysis);
    expect(notes).toContain("Match score: 50%");
    expect(notes).toContain("typescript");
    expect(notes).toContain("react");
  });

  it("deduplicates technologies", () => {
    const analysis: JobAnalysisResult = {
      requiredSkills: ["typescript", "react"],
      preferredSkills: ["react"],
      technologies: ["typescript"],
      certifications: [],
      experienceYears: null,
      keywords: [],
    };

    expect(technologiesFromJobAnalysis(analysis)).toEqual(["typescript", "react"]);
  });
});
