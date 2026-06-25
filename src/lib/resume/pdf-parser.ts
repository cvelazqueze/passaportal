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
  professionalSummary?: string;
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

const SECTION_HEADERS: { pattern: RegExp; key: string }[] = [
  { pattern: /^PROFESSIONAL\s+SUMMARY|^SUMMARY|^PROFILE|^ABOUT\s+ME/i, key: "summary" },
  { pattern: /^PROFESSIONAL\s+EXPERIENCE|^WORK\s+EXPERIENCE|^EMPLOYMENT|^EXPERIENCE|^EXPERIENCIA/i, key: "experience" },
  { pattern: /^EDUCATION|^EDUCACI[ÓO]N|^FORMACI[ÓO]N/i, key: "education" },
  { pattern: /^SKILLS|^TECHNICAL\s+SKILLS|^CORE\s+COMPETENCIES|^HABILIDADES/i, key: "skills" },
  { pattern: /^CERTIFICATIONS|^ADDITIONAL\s+INFORMATION|^LANGUAGES/i, key: "additional" },
];

const DATE_RANGE_RE =
  /((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—]\s*(?:PRESENT|CURRENT|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/i;

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

const EXP_HEADER_RE =
  /^(.+?)\s*(?:—|-)\s*(.+?)(?:\s+VIA\s+.+?)?\s+((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\s*-\s*(?:PRESENT|CURRENT|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}))/i;

const EXP_HEADER_SIMPLE_RE =
  /^(.+?)\s+((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}\s*-\s*(?:PRESENT|CURRENT|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{4}))/i;

export function parseResumeText(rawText: string): ParsedResume {
  const lines = normalizePdfLines(rawText);

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
  if (lines[idx] && !isContactLine(lines[idx]) && !matchSectionHeader(lines[idx])) {
    result.professionalTitle = lines[idx];
    idx++;
  }

  if (lines[idx] && isContactLine(lines[idx])) {
    parseContactLine(lines[idx], result);
    idx++;
  }

  // Split into sections
  const sections = splitSections(lines.slice(idx));

  if (sections.summary?.length) {
    result.professionalSummary = sections.summary.join(" ").replace(/\s+/g, " ").trim();
  }
  if (sections.experience) {
    result.experiences = parseExperienceSection(sections.experience);
  }
  if (sections.education) {
    result.education = parseEducationSection(sections.education);
  }
  if (sections.skills?.length) {
    result.skills = parseSkillsSection(sections.skills);
  }
  if (sections.additional) {
    parseAdditionalSection(sections.additional, result);
  }

  if (result.skills.length === 0) {
    result.skills = extractTechnologies(
      result.experiences.flatMap((e) => e.bullets)
    );
  }
  result.technologies = [
    ...new Set([
      ...result.skills,
      ...extractTechnologies(result.experiences.flatMap((e) => e.bullets)),
    ]),
  ];
  if (result.skills.length === 0) {
    result.skills = [...result.technologies];
  }

  return result;
}

function normalizePdfLines(rawText: string): string[] {
  const rawLines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/–/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !l.match(/^-- \d+ of \d+ --$/));

  const merged: string[] = [];

  for (const line of rawLines) {
    const prev = merged[merged.length - 1];
    if (prev && shouldJoinPdfLines(prev, line)) {
      merged[merged.length - 1] = `${prev} ${line}`;
    } else {
      merged.push(line);
    }
  }

  return merged;
}

function shouldJoinPdfLines(prev: string, current: string): boolean {
  if (matchSectionHeader(current) || matchSectionHeader(prev)) return false;
  if (isBullet(current) || isBullet(prev)) return false;
  if (DATE_RANGE_RE.test(current) || EXP_HEADER_RE.test(current)) return false;
  // Continuation of a wrapped bullet or sentence (PDF line breaks mid-phrase)
  if (/^[a-z(,]/.test(current)) return true;
  if (/,\s*$/.test(prev) && !/[.!?:]$/.test(prev)) return true;
  return false;
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
    summary: sections.summary,
    experience: sections.experience,
    education: sections.education,
    skills: sections.skills,
    additional: sections.additional,
  };
}

function matchSectionHeader(line: string): string | null {
  const normalized = line.trim().replace(/:$/, "");
  for (const { pattern, key } of SECTION_HEADERS) {
    if (pattern.test(normalized)) return key;
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

function parseExperienceSection(lines: string[]): ParsedExperience[] {
  const coalesced = coalesceExperienceLines(lines);
  const experiences: ParsedExperience[] = [];
  let current: ParsedExperience | null = null;
  let pendingCompanyLine: string | null = null;

  function pushCurrent() {
    if (current) {
      current.bullets = mergeFragmentBullets(current.bullets);
      current.technologies = [...new Set(current.technologies)];
      experiences.push(current);
      current = null;
    }
    pendingCompanyLine = null;
  }

  function startExperience(company: string, location: string | undefined, dateText: string) {
    pushCurrent();
    const dates = parseDateRange(dateText);
    current = {
      company: cleanCompany(company),
      position: "",
      location,
      startDate: dates.start,
      endDate: dates.end,
      isCurrent: dates.isCurrent,
      bullets: [],
      technologies: [],
    };
  }

  for (const line of coalesced) {
    const normalized = line.replace(/\t/g, "  ").trim();
    if (!normalized) continue;

    const headerMatch =
      normalized.match(EXP_HEADER_RE) ?? normalized.match(EXP_HEADER_SIMPLE_RE);

    if (headerMatch) {
      const location = headerMatch[2]?.trim();
      startExperience(
        headerMatch[1],
        location && !DATE_RANGE_RE.test(location) ? location : undefined,
        headerMatch[3] ?? headerMatch[2]
      );
      continue;
    }

    const inlineDate = normalized.match(DATE_RANGE_RE);
    if (inlineDate) {
      const dateText = inlineDate[1];
      const beforeDates = normalized.slice(0, inlineDate.index).trim();
      const companyPart = pendingCompanyLine ?? beforeDates;
      const locationPart =
        pendingCompanyLine && beforeDates
          ? beforeDates.replace(/^(?:—|-)\s*/, "")
          : undefined;

      if (companyPart) {
        startExperience(companyPart, locationPart, dateText);
        pendingCompanyLine = null;
        continue;
      }
    }

    if (DATE_RANGE_RE.test(normalized) && pendingCompanyLine) {
      startExperience(pendingCompanyLine, undefined, normalized.match(DATE_RANGE_RE)![1]);
      continue;
    }

    if (!current && !isBullet(normalized) && !DATE_RANGE_RE.test(normalized)) {
      pendingCompanyLine = normalized;
      continue;
    }

    if (!current) continue;
    const exp: ParsedExperience = current;

    if (isBullet(normalized)) {
      const bullet = stripBullet(normalized);
      if (bullet) {
        exp.bullets.push(bullet);
        exp.technologies.push(...extractTechnologies([bullet]));
      }
      continue;
    }

    if (!exp.position && !isBullet(normalized) && !DATE_RANGE_RE.test(normalized)) {
      exp.position = normalized;
      continue;
    }

    if (exp.bullets.length > 0) {
      exp.bullets[exp.bullets.length - 1] += ` ${normalized}`;
      exp.technologies.push(...extractTechnologies([normalized]));
    } else if (normalized.length > 20) {
      exp.bullets.push(normalized);
      exp.technologies.push(...extractTechnologies([normalized]));
    }
  }

  pushCurrent();
  return experiences;
}

function parseSkillsSection(lines: string[]): string[] {
  const skills = new Set<string>();
  for (const line of lines) {
    const normalized = line.trim();
    if (!normalized) continue;
    const text = isBullet(normalized) ? stripBullet(normalized) : normalized;
    for (const part of text.split(/[,;|]/)) {
      const skill = part.trim();
      if (skill.length > 1 && skill.length < 50) skills.add(skill);
    }
  }
  return Array.from(skills);
}

function stripBullet(line: string): string {
  return line.replace(/^([●•\-*◦▪○]|\d+\.)\s*/, "").trim();
}

function isCompleteSentence(text: string): boolean {
  return /[.!?]["']?\s*$/.test(text.trim());
}

function looksLikeNewBullet(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return false;
  return /^(Designed|Developed|Delivered|Led|Mentored|Built|Implemented|Created|Managed|Optimized|Collaborated|Spearheaded|Architected|Established|Improved|Reduced|Increased|Automated|Maintained|Coordinated|Supported|Conducted|Analyzed|Deployed|Integrated|Refactored|Championed|Drove|Facilitated|Streamlined|Executed|Achieved|Partnered|Worked|Provided|Responsible|Assisted|Contributed)\b/i.test(
    t
  );
}

function shouldMergeBulletFragment(prev: string, current: string): boolean {
  const p = prev.trim();
  const c = current.trim();
  if (!p || !c) return false;

  if (looksLikeNewBullet(c)) return false;

  if (/^[a-z(,]/.test(c)) return true;
  if (c.length <= 5) return true;
  if (
    /^(and|or|to|with|for|via|using|through|refine)\b/i.test(c) &&
    c.length < 50
  ) {
    return true;
  }
  if (/[,;]$/.test(p) && c.split(/\s+/).length <= 4) return true;

  return false;
}

function mergeFragmentBullets(bullets: string[]): string[] {
  const merged: string[] = [];
  for (const bullet of bullets) {
    const trimmed = bullet.trim();
    if (!trimmed) continue;
    const prev = merged[merged.length - 1];
    if (prev && shouldMergeBulletFragment(prev, trimmed)) {
      merged[merged.length - 1] = `${prev} ${trimmed}`;
    } else {
      merged.push(trimmed);
    }
  }
  return merged;
}

/** PDFs often repeat bullet markers on every wrapped line — merge before parsing. */
function coalesceExperienceLines(lines: string[]): string[] {
  const result: string[] = [];

  for (const line of lines) {
    const normalized = line.replace(/\t/g, " ").trim();
    if (!normalized) continue;

    const prev = result[result.length - 1];
    if (!prev) {
      result.push(normalized);
      continue;
    }

    const prevText = isBullet(prev) ? stripBullet(prev) : prev;
    const currentText = isBullet(normalized) ? stripBullet(normalized) : normalized;
    const prevIsBullet = isBullet(prev);

    const canMerge =
      shouldMergeBulletFragment(prevText, currentText) &&
      (prevIsBullet || isBullet(normalized) || /^[a-z(,]/.test(currentText));

    if (canMerge) {
      const combined = `${prevText} ${currentText}`;
      result[result.length - 1] =
        prevIsBullet || isBullet(normalized) ? `● ${combined}` : combined;
      continue;
    }

    result.push(normalized);
  }

  return result;
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
  const start = parseMonthYear(parts[0]?.trim() ?? "") ?? parseYearOnly(parts[0]?.trim() ?? "") ?? new Date();
  const endPart = parts[1]?.trim().toUpperCase() ?? "";
  const isCurrent = endPart === "PRESENT" || endPart === "CURRENT";
  const end = isCurrent ? null : parseMonthYear(parts[1]?.trim() ?? "") ?? parseYearOnly(parts[1]?.trim() ?? "");
  return { start, end, isCurrent };
}

function parseYearOnly(token: string): Date | null {
  const match = token.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  return new Date(parseInt(match[0], 10), 0, 1);
}

function parseMonthYear(token: string): Date | null {
  const match = token.match(/([A-Za-z]+)\.?\s+(\d{4})/);
  if (!match) return null;
  const month = MONTH_MAP[match[1].toLowerCase()];
  if (month === undefined) return null;
  return new Date(parseInt(match[2], 10), month, 1);
}

function isBullet(line: string): boolean {
  return /^([●•\-*◦▪○]|\d+\.)\s/.test(line);
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
