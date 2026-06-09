import { describe, it, expect } from "vitest";
import { scoreCandidate } from "@/lib/scoring/candidate-ranking";

describe("Candidate Ranking", () => {
  const baseCandidate = {
    skills: [
      { name: "TypeScript", yearsExperience: 5 },
      { name: "React", yearsExperience: 4 },
      { name: "Node.js", yearsExperience: 6 },
    ],
    certifications: [{ name: "AWS Solutions Architect" }],
    experiences: [
      {
        startDate: new Date("2018-01-01"),
        endDate: null,
        isCurrent: true,
      },
    ],
    languages: ["English"],
  };

  it("scores a well-matched candidate highly", () => {
    const result = scoreCandidate(baseCandidate, {
      requiredSkills: ["TypeScript", "Node.js"],
      preferredSkills: ["React"],
      requiredCertifications: ["AWS Solutions Architect"],
      minYearsExperience: 5,
      languages: ["English"],
    });

    expect(result.percentage).toBeGreaterThanOrEqual(80);
    expect(result.breakdown.requiredSkills.matched).toContain("TypeScript");
    expect(result.breakdown.requiredSkills.matched).toContain("Node.js");
  });

  it("identifies missing required skills", () => {
    const result = scoreCandidate(baseCandidate, {
      requiredSkills: ["TypeScript", "Go", "Rust"],
      preferredSkills: [],
    });

    expect(result.breakdown.requiredSkills.missing).toContain("Go");
    expect(result.breakdown.requiredSkills.missing).toContain("Rust");
    expect(result.percentage).toBeLessThan(80);
  });

  it("calculates experience years correctly", () => {
    const result = scoreCandidate(baseCandidate, {
      requiredSkills: [],
      preferredSkills: [],
      minYearsExperience: 3,
    });

    expect(result.breakdown.experience.years).toBeGreaterThanOrEqual(6);
  });
});

describe("Privacy Validation", () => {
  const FORBIDDEN_FIELDS = [
    "ssn", "birthDate", "gender", "homeAddress",
  ];

  it("rejects forbidden personal data fields", () => {
    const candidateData = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };

    for (const field of FORBIDDEN_FIELDS) {
      expect(field in candidateData).toBe(false);
    }
  });
});
