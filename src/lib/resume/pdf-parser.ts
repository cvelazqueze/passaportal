/**
 * Rule-based ATS resume text parser. No AI — uses section headers,
 * date patterns, and bullet markers to extract structured profile data.
 */

export interface ParsedExperience {
  company: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  bullets: string[];
  technologies: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  location?: string;
  startDate: Date;
  endDate?: Date | null;
}

export interface ParsedCertification {
  name: string;
  issuer?: string;
  year?: number;
}

export interface ParsedResume {
  firstName: string;
  lastName: string;
  professionalTitle?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  github?: string;
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  certifications: ParsedCertification[];
  skills: string[];
  technologies: string[];
}

const SECTION_HEADERS = [
  "PROFESSIONAL EXPERIENCE",
  "WORK EXPERIENCE",
  "EXPERIENCE",
  "EDUCATION",
  "ADDITIONAL INFORMATION",
  "CERTIFICATIONS",
  "SKILLS",
];

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const TECH_PATTERNS = [
  "TypeScript", "JavaScript", "Node.js", "NodeJS", "React", "GraphQL", "Graphql",
  "PostgreSQL", "MongoDB", "AWS", "Azure", "Terraform", "Docker", "Kubernetes",
  "Java", "Python", "Ruby", "Rails", "Express", "Jest", "Knex", "Swagger",
  "Groovy", "Spring", "HTML", "CI/CD", "Lambda", "Mongoose", "Bash",
];

const EMAIL_RE = /[\w.+-]+@[\w.-]+\.\w+/i;
const PHONE_RE = /\+?\d[\d\s().-]{8,}\d/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const GITHUB_PATTERN = /(?:github\.com\/[\w-]+|https?:\/\/github\.com\/[\w-]+)/i;

export function parseResumeText(rawText: string): ParsedResume {
  const text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/–/g, "-")
    .replace(/\u2013/g, "-");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.match(/^-- \d+ of \d+ --$/));

  const result: ParsedResume = {
    firstName: "",
    lastName: "",
    experiences: [],
    education: [],
    certifications: [],
    skills: [],
    technologies: [],
  };

  if (lines.length === 0) return result;

  // Header: name, title, contact
  const nameLine = lines[0];
  const nameParts = nameLine.split(/\s+/);
  result.firstName = capitalize(nameParts[0] ?? "");
  result.lastName = nameParts.slice(1).map(capitalize).join(" ");

  let idx = 1;
  if (lines[idx] && !isContactLine(lines[idx]) && !isSectionHeader(lines[idx])) {
    result.professionalTitle = lines[idx];
    idx++;
  }

  if (lines[idx] && isContactLine(lines[idx])) {
    parseContactLine(lines[idx], result);
    idx++;
  }

  // Split into sections
  const sections = splitSections(lines.slice(idx));

  if (sections.experience) {
    result.experiences = parseExperienceSection(sections.experience);
  }
  if (sections.education) {
    result.education = parseEducationSection(sections.education);
  }
  if (sections.additional) {
    parseAdditionalSection(sections.additional, result);
  }

  result.technologies = extractTechnologies(
    result.experiences.flatMap((e) => e.bullets)
  );
  result.skills = [...result.technologies];

  return result;
}

function splitSections(lines: string[]) {
  const sections: Record<string, string[]> = {};
  let current = "preamble";
  sections[current] = [];

  for (const line of lines) {
    const header = matchSectionHeader(line);
    if (header) {
      current = header;
      sections[current] = [];
    } else {
      if (!sections[current]) sections[current] = [];
      sections[current].push(line);
    }
  }

  return {
    experience: sections.experience ?? sections["work experience"],
    education: sections.education,
    additional: sections.additional ?? sections.certifications,
  };
}

function matchSectionHeader(line: string): string | null {
  const upper = line.toUpperCase().trim();
  for (const h of SECTION_HEADERS) {
    if (upper === h || upper.startsWith(h)) {
      if (h.includes("EXPERIENCE") && !h.includes("PROFESSIONAL")) return "experience";
      if (h === "PROFESSIONAL EXPERIENCE" || h === "WORK EXPERIENCE") return "experience";
      if (h === "EXPERIENCE") return "experience";
      if (h === "EDUCATION") return "education";
      if (h === "ADDITIONAL INFORMATION" || h === "CERTIFICATIONS") return "additional";
      if (h === "SKILLS") return "skills";
    }
  }
  return null;
}

function isSectionHeader(line: string): boolean {
  return matchSectionHeader(line) !== null;
}

function isContactLine(line: string): boolean {
  return (
    line.includes("•") ||
    EMAIL_RE.test(line) ||
    PHONE_RE.test(line) ||
    LINKEDIN_RE.test(line)
  );
}

function parseContactLine(line: string, result: ParsedResume) {
  const email = line.match(EMAIL_RE);
  if (email) result.email = email[0].toLowerCase();

  const phone = line.match(PHONE_RE);
  if (phone) result.phone = phone[0].trim();

  const linkedin = line.match(LINKEDIN_RE);
  if (linkedin) result.linkedIn = normalizeUrl(linkedin[0], "https://");

  const github = line.match(GITHUB_PATTERN);
  if (github) result.github = normalizeUrl(github[0], "https://");
}

const EXP_HEADER_RE =
  /^(.+?)\s*(?:—|-)\s*(.+?)(?:\s+VIA\s+.+?)?\s+((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\s*-\s*(?:PRESENT|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}))/i;

const EXP_HEADER_SIMPLE_RE =
  /^(.+?)\s+((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\s*-\s*(?:PRESENT|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}))/i;

function parseExperienceSection(lines: string[]): ParsedExperience[] {
  const experiences: ParsedExperience[] = [];
  let current: ParsedExperience | null = null;

  for (const line of lines) {
    const normalized = line.replace(/\t/g, "  ").trim();
    const headerMatch =
      normalized.match(EXP_HEADER_RE) ?? normalized.match(EXP_HEADER_SIMPLE_RE);

    if (headerMatch) {
      if (current) experiences.push(current);
      const company = cleanCompany(headerMatch[1]);
      const location = headerMatch[2]?.trim();
      const dates = parseDateRange(headerMatch[3] ?? headerMatch[2]);

      current = {
        company,
        position: "",
        location: location && !location.match(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/i)
          ? location
          : undefined,
        startDate: dates.start,
        endDate: dates.end,
        isCurrent: dates.isCurrent,
        bullets: [],
        technologies: [],
      };
      continue;
    }

    if (!current) continue;

    if (isBullet(normalized)) {
      const bullet = normalized.replace(/^[●•\-*]\s*/, "").trim();
      if (bullet) {
        current.bullets.push(bullet);
        current.technologies.push(...extractTechnologies([bullet]));
      }
    } else if (!current.position && normalized.length > 0) {
      current.position = normalized;
    }
  }

  if (current) experiences.push(current);

  for (const exp of experiences) {
    exp.technologies = [...new Set(exp.technologies)];
  }

  return experiences;
}

function parseEducationSection(lines: string[]): ParsedEducation[] {
  const education: ParsedEducation[] = [];
  let current: Partial<ParsedEducation> | null = null;

  for (const line of lines) {
    const normalized = line.replace(/\t/g, "  ").trim();
    const dateMatch = normalized.match(
      /((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\s*-\s*(?:(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}|PRESENT))/i
    );

    if (dateMatch && current?.institution) {
      const dates = parseDateRange(dateMatch[1]);
      const degreePart = normalized.replace(dateMatch[1], "").trim();
      if (degreePart) current.degree = degreePart;
      current.startDate = dates.start;
      current.endDate = dates.end;
      education.push(current as ParsedEducation);
      current = null;
      continue;
    }

    if (!current) {
      const instMatch = normalized.match(/^(.+?)(?:\s+(?:—|-)\s+|\t)(.+)$/);
      if (instMatch) {
        current = {
          institution: instMatch[1].trim(),
          location: instMatch[2].trim(),
          degree: "",
          startDate: new Date(),
        };
      } else if (!isBullet(normalized)) {
        current = { institution: normalized, degree: "", startDate: new Date() };
      }
      continue;
    }

    if (!current.degree && !isBullet(normalized)) {
      if (dateMatch) {
        const dates = parseDateRange(dateMatch[1]);
        current.degree = normalized.replace(dateMatch[1], "").trim();
        current.startDate = dates.start;
        current.endDate = dates.end;
        education.push(current as ParsedEducation);
        current = null;
      } else {
        current.degree = normalized;
      }
    }
  }

  if (current?.institution && current.degree) {
    education.push(current as ParsedEducation);
  }

  return education;
}

function parseAdditionalSection(lines: string[], result: ParsedResume) {
  const full = lines.join(" ");

  const certMatch = full.match(/Certifications?:\s*(.+?)(?:\n|●|$)/i);
  if (certMatch) {
    const certParts = certMatch[1].split(/,(?![^(]*\))/);
    for (const part of certParts) {
      const trimmed = part.replace(/^[●•\-*]\s*/, "").trim();
      const yearMatch = trimmed.match(/\((\d{4})\)/);
      result.certifications.push({
        name: trimmed.replace(/\(\d{4}\)/, "").trim(),
        year: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
      });
    }
  }

  const githubMatch = full.match(/Github Portfolio:\s*(\S+)/i);
  if (githubMatch) {
    result.github = normalizeUrl(githubMatch[1], "https://");
  }
}

function parseDateRange(range: string): {
  start: Date;
  end: Date | null;
  isCurrent: boolean;
} {
  const parts = range.split(/\s*-\s*/i);
  const start = parseMonthYear(parts[0]?.trim() ?? "") ?? new Date();
  const endPart = parts[1]?.trim().toUpperCase() ?? "";
  const isCurrent = endPart === "PRESENT";
  const end = isCurrent ? null : parseMonthYear(parts[1]?.trim() ?? "");
  return { start, end, isCurrent };
}

function parseMonthYear(token: string): Date | null {
  const match = token.match(/([A-Za-z]+)\.?\s+(\d{4})/);
  if (!match) return null;
  const month = MONTH_MAP[match[1].toLowerCase()];
  if (month === undefined) return null;
  return new Date(parseInt(match[2], 10), month, 1);
}

function isBullet(line: string): boolean {
  return /^[●•\-*]\s/.test(line);
}

function cleanCompany(raw: string): string {
  return raw
    .replace(/\s+VIA\s+.+$/i, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim();
}

function extractTechnologies(texts: string[]): string[] {
  const found = new Set<string>();
  const combined = texts.join(" ");
  for (const tech of TECH_PATTERNS) {
    const re = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i");
    if (re.test(combined)) {
      found.add(normalizeTechName(tech));
    }
  }
  return Array.from(found);
}

function normalizeTechName(tech: string): string {
  const map: Record<string, string> = {
    NodeJS: "Node.js",
    Graphql: "GraphQL",
    Rails: "Ruby on Rails",
  };
  return map[tech] ?? tech;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function normalizeUrl(value: string, defaultProtocol: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("linkedin.com") || trimmed.startsWith("github.com")) {
    return `${defaultProtocol}${trimmed}`;
  }
  return trimmed.includes("://") ? trimmed : `${defaultProtocol}${trimmed}`;
}

export async function parseResumePdf(buffer: Buffer): Promise<ParsedResume> {
  const { extractPdfText } = await import("@/lib/resume/pdf-extract.server");
  const text = await extractPdfText(buffer);
  return parseResumeText(text);
}
