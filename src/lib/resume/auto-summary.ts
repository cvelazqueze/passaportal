/**
 * Rule-based professional summary for the Profile Hub only.
 * Never included in generated resume exports.
 */

interface SummaryInput {
  professionalTitle?: string | null;
  experiences: {
    position: string;
    company: string;
    isCurrent: boolean;
    technologies: string[];
  }[];
  skills: { name: string; yearsExperience?: number | null }[];
  education: { degree: string; institution: string }[];
  technologies?: string[];
}

export function generateAutoSummary(input: SummaryInput): string {
  const parts: string[] = [];

  const title = input.professionalTitle?.trim();
  const years = estimateYearsExperience(input.experiences.length);
  const topSkills = [
    ...new Set([
      ...input.skills.slice(0, 6).map((s) => s.name),
      ...(input.technologies ?? []).slice(0, 4),
    ]),
  ].slice(0, 8);

  if (title) {
    parts.push(
      `${title} with ${years}+ years of experience building and delivering production software.`
    );
  } else if (input.experiences.length > 0) {
    const latest = input.experiences.find((e) => e.isCurrent) ?? input.experiences[0];
    parts.push(
      `Experienced ${latest.position} with ${years}+ years across ${input.experiences.length} roles.`
    );
  } else {
    parts.push("Software professional focused on delivering high-quality solutions.");
  }

  if (topSkills.length > 0) {
    parts.push(`Core strengths include ${topSkills.join(", ")}.`);
  }

  const companies = input.experiences
    .slice(0, 4)
    .map((e) => e.company)
    .filter(Boolean);
  if (companies.length > 0) {
    parts.push(`Background includes work at ${companies.join(", ")}.`);
  }

  const topDegree = input.education[0];
  if (topDegree) {
    parts.push(`Education: ${topDegree.degree} from ${topDegree.institution}.`);
  }

  return parts.join(" ");
}

function estimateYearsExperience(roleCount: number): number {
  if (roleCount >= 8) return 10;
  if (roleCount >= 5) return 7;
  if (roleCount >= 3) return 5;
  if (roleCount >= 1) return 3;
  return 1;
}
