const TECH_KEYWORDS = [
  "typescript", "javascript", "python", "java", "go", "rust", "ruby", "php", "c++", "c#",
  "react", "vue", "angular", "next.js", "node.js", "express", "django", "spring", "fastapi",
  "postgresql", "mysql", "mongodb", "redis", "graphql", "rest", "aws", "azure", "gcp",
  "docker", "kubernetes", "terraform", "ci/cd", "jenkins", "git", "linux",
];

const CERT_KEYWORDS = [
  "aws certified", "azure certified", "gcp certified", "pmp", "scrum", "cissp", "cka", "ckad",
];

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) found.add(kw);
  }

  const yearsMatch = lower.match(/(\d+)\+?\s*years?/g);
  void yearsMatch;

  return Array.from(found);
}

function extractCertifications(text: string): string[] {
  const lower = text.toLowerCase();
  return CERT_KEYWORDS.filter((c) => lower.includes(c));
}

function extractExperienceYears(text: string): number | null {
  const match = text.toLowerCase().match(/(\d+)\+?\s*years?(?:\s+of)?\s+experience/);
  return match ? parseInt(match[1], 10) : null;
}

export interface JobAnalysisResult {
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  certifications: string[];
  experienceYears: number | null;
  keywords: string[];
}

export interface MatchAnalysisResult {
  matchingSkills: string[];
  missingSkills: string[];
  matchingTechnologies: string[];
  missingTechnologies: string[];
  suggestions: string[];
  matchPercentage: number;
}

export function analyzeJobDescription(description: string): JobAnalysisResult {
  const lower = description.toLowerCase();
  const technologies = extractKeywords(description);
  const certifications = extractCertifications(description);
  const experienceYears = extractExperienceYears(description);

  const requiredSection = lower.split(/preferred|nice to have|bonus/)[0] ?? lower;
  const requiredSkills = extractKeywords(requiredSection);
  const preferredSkills = extractKeywords(
    lower.includes("preferred") ? lower.split("preferred")[1] ?? "" : ""
  ).filter((s) => !requiredSkills.includes(s));

  const keywords = Array.from(
    new Set(
      description
        .toLowerCase()
        .match(/\b[a-z][a-z0-9+#./-]{2,}\b/g)
        ?.filter((w) => w.length > 2 && w.length < 30)
        .slice(0, 30) ?? []
    )
  );

  return {
    requiredSkills,
    preferredSkills,
    technologies,
    certifications,
    experienceYears,
    keywords,
  };
}

export function matchProfileToJob(
  profile: {
    skills: { name: string }[];
    technologies: string[];
    certifications: { name: string }[];
    experiences: { technologies: string[] }[];
  },
  analysis: JobAnalysisResult
): MatchAnalysisResult {
  const profileSkills = new Set(
    [
      ...profile.skills.map((s) => s.name.toLowerCase()),
      ...profile.technologies.map((t) => t.toLowerCase()),
      ...profile.experiences.flatMap((e) => e.technologies.map((t) => t.toLowerCase())),
    ]
  );

  const profileCerts = new Set(
    profile.certifications.map((c) => c.name.toLowerCase())
  );

  const allRequired = [...analysis.requiredSkills, ...analysis.technologies];
  const matchingSkills = allRequired.filter((s) =>
    Array.from(profileSkills).some((ps) => ps.includes(s) || s.includes(ps))
  );
  const missingSkills = allRequired.filter(
    (s) => !matchingSkills.includes(s)
  );

  const matchingTechnologies = analysis.technologies.filter((t) =>
    Array.from(profileSkills).some((ps) => ps.includes(t) || t.includes(ps))
  );
  const missingTechnologies = analysis.technologies.filter(
    (t) => !matchingTechnologies.includes(t)
  );

  const suggestions: string[] = [];
  if (missingSkills.length > 0) {
    suggestions.push(`Highlight experience with: ${missingSkills.slice(0, 5).join(", ")}`);
  }
  if (analysis.experienceYears) {
    suggestions.push(`Job requires ~${analysis.experienceYears}+ years of experience`);
  }
  if (analysis.certifications.length > 0 && profileCerts.size === 0) {
    suggestions.push(`Consider certifications: ${analysis.certifications.join(", ")}`);
  }
  if (missingSkills.length > 3) {
    suggestions.push("Emphasize matching skills first when tailoring your resume in Resume Hub");
  }

  const totalItems = allRequired.length || 1;
  const matchPercentage = Math.round((matchingSkills.length / totalItems) * 100);

  return {
    matchingSkills,
    missingSkills,
    matchingTechnologies,
    missingTechnologies,
    suggestions,
    matchPercentage,
  };
}
