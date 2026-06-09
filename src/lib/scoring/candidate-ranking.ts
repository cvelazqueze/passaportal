interface ScoringCriteria {
  requiredSkills: string[];
  preferredSkills: string[];
  requiredCertifications?: string[];
  minYearsExperience?: number;
  languages?: string[];
}

interface CandidateData {
  skills: { name: string; yearsExperience?: number | null }[];
  certifications: { name: string }[];
  experiences: { startDate: Date; endDate?: Date | null; isCurrent: boolean }[];
  languages?: string[];
}

interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    requiredSkills: { score: number; max: number; matched: string[]; missing: string[] };
    preferredSkills: { score: number; max: number; matched: string[]; missing: string[] };
    experience: { score: number; max: number; years: number };
    certifications: { score: number; max: number; matched: string[]; missing: string[] };
    languages: { score: number; max: number; matched: string[]; missing: string[] };
  };
}

const WEIGHTS = {
  requiredSkills: 40,
  preferredSkills: 20,
  experience: 20,
  certifications: 10,
  languages: 10,
};

function calculateYearsExperience(
  experiences: CandidateData["experiences"]
): number {
  let totalMonths = 0;
  for (const exp of experiences) {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }
  return Math.round(totalMonths / 12);
}

function matchItems(
  candidateItems: string[],
  requiredItems: string[]
): { matched: string[]; missing: string[] } {
  const normalizedCandidate = candidateItems.map((s) => s.toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];

  for (const item of requiredItems) {
    const normalized = item.toLowerCase();
    if (normalizedCandidate.some((c) => c.includes(normalized) || normalized.includes(c))) {
      matched.push(item);
    } else {
      missing.push(item);
    }
  }

  return { matched, missing };
}

export function scoreCandidate(
  candidate: CandidateData,
  criteria: ScoringCriteria
): ScoringResult {
  const candidateSkills = candidate.skills.map((s) => s.name);
  const candidateCerts = candidate.certifications.map((c) => c.name);
  const candidateLanguages = candidate.languages ?? [];
  const yearsExp = calculateYearsExperience(candidate.experiences);

  const reqSkillMatch = matchItems(candidateSkills, criteria.requiredSkills);
  const reqSkillScore =
    criteria.requiredSkills.length > 0
      ? (reqSkillMatch.matched.length / criteria.requiredSkills.length) *
        WEIGHTS.requiredSkills
      : WEIGHTS.requiredSkills;

  const prefSkillMatch = matchItems(candidateSkills, criteria.preferredSkills);
  const prefSkillScore =
    criteria.preferredSkills.length > 0
      ? (prefSkillMatch.matched.length / criteria.preferredSkills.length) *
        WEIGHTS.preferredSkills
      : WEIGHTS.preferredSkills;

  const minYears = criteria.minYearsExperience ?? 0;
  const expScore =
    minYears > 0
      ? Math.min(yearsExp / minYears, 1) * WEIGHTS.experience
      : WEIGHTS.experience;

  const reqCerts = criteria.requiredCertifications ?? [];
  const certMatch = matchItems(candidateCerts, reqCerts);
  const certScore =
    reqCerts.length > 0
      ? (certMatch.matched.length / reqCerts.length) * WEIGHTS.certifications
      : WEIGHTS.certifications;

  const reqLangs = criteria.languages ?? [];
  const langMatch = matchItems(candidateLanguages, reqLangs);
  const langScore =
    reqLangs.length > 0
      ? (langMatch.matched.length / reqLangs.length) * WEIGHTS.languages
      : WEIGHTS.languages;

  const totalScore = reqSkillScore + prefSkillScore + expScore + certScore + langScore;
  const maxScore = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    breakdown: {
      requiredSkills: {
        score: Math.round(reqSkillScore * 10) / 10,
        max: WEIGHTS.requiredSkills,
        matched: reqSkillMatch.matched,
        missing: reqSkillMatch.missing,
      },
      preferredSkills: {
        score: Math.round(prefSkillScore * 10) / 10,
        max: WEIGHTS.preferredSkills,
        matched: prefSkillMatch.matched,
        missing: prefSkillMatch.missing,
      },
      experience: {
        score: Math.round(expScore * 10) / 10,
        max: WEIGHTS.experience,
        years: yearsExp,
      },
      certifications: {
        score: Math.round(certScore * 10) / 10,
        max: WEIGHTS.certifications,
        matched: certMatch.matched,
        missing: certMatch.missing,
      },
      languages: {
        score: Math.round(langScore * 10) / 10,
        max: WEIGHTS.languages,
        matched: langMatch.matched,
        missing: langMatch.missing,
      },
    },
  };
}
