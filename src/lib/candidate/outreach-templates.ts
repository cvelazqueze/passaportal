import type { Locale } from "@/lib/i18n";
import type { JobAnalysisResult } from "@/lib/candidate/job-analysis";

export type OutreachKindKey = "COVER_LETTER" | "APPLICATION_EMAIL" | "FOLLOW_UP_EMAIL";

export interface OutreachProfileContext {
  candidateName: string;
  candidateEmail: string;
  candidateTitle: string;
  professionalSummary?: string | null;
  matchingSkills: string[];
  latestExperience?: {
    title: string;
    company: string;
    highlights?: string | null;
  } | null;
}

export interface GeneratedOutreach {
  subject?: string;
  body: string;
  placeholders: string[];
}

function formatSkillList(skills: string[], locale: Locale): string {
  if (skills.length === 0) return "";
  const list = skills.slice(0, 5);
  if (list.length === 1) return list[0];
  const joiner = locale === "es" ? " y " : " and ";
  if (list.length === 2) return list.join(joiner);
  return `${list.slice(0, -1).join(", ")}${joiner}${list[list.length - 1]}`;
}

function salutation(recipientName: string | undefined, locale: Locale): string {
  if (recipientName?.trim()) {
    return locale === "es" ? `Estimado/a ${recipientName.trim()},` : `Dear ${recipientName.trim()},`;
  }
  return locale === "es" ? "Estimado equipo de contratación," : "Dear Hiring Manager,";
}

function skillsParagraph(skills: string[], locale: Locale): string {
  const formatted = formatSkillList(skills, locale);
  if (!formatted) {
    return locale === "es"
      ? "Mi experiencia profesional se alinea con los requisitos descritos en la oferta, y estoy entusiasmado/a por aportar valor a su equipo."
      : "My professional background aligns with the requirements outlined in the job description, and I am excited about the opportunity to contribute to your team.";
  }
  return locale === "es"
    ? `Mis fortalezas clave incluyen ${formatted}, competencias que encajan directamente con lo que buscan para este rol.`
    : `My core strengths include ${formatted}, which map directly to what you are looking for in this role.`;
}

function experienceParagraph(
  experience: OutreachProfileContext["latestExperience"],
  locale: Locale
): string {
  if (!experience) {
    return locale === "es"
      ? "En roles anteriores he desarrollado habilidades transferibles que me preparan para asumir esta posición con confianza."
      : "In previous roles I have built transferable skills that prepare me to take on this position with confidence.";
  }
  const base =
    locale === "es"
      ? `En mi rol más reciente como ${experience.title} en ${experience.company},`
      : `In my most recent role as ${experience.title} at ${experience.company},`;
  return locale === "es"
    ? `${base} adquirí experiencia práctica que me prepara para esta oportunidad.`
    : `${base} I gained hands-on experience that prepares me for this opportunity.`;
}

function todayFormatted(locale: Locale): string {
  return new Date().toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PLACEHOLDER = {
  en: "[Add a sentence about why this role or company specifically interests you.]",
  es: "[Agrega una frase sobre por qué este rol o esta empresa te interesa en particular.]",
} as const;

export function generateOutreach(
  kind: OutreachKindKey,
  ctx: OutreachProfileContext,
  jobTitle: string,
  company: string,
  recipientName: string | undefined,
  locale: Locale
): GeneratedOutreach {
  const greeting = salutation(recipientName, locale);
  const skills = skillsParagraph(ctx.matchingSkills, locale);
  const experience = experienceParagraph(ctx.latestExperience, locale);
  const placeholder = PLACEHOLDER[locale];
  const date = todayFormatted(locale);

  if (kind === "COVER_LETTER") {
    const body =
      locale === "es"
        ? `${ctx.candidateName}
${ctx.candidateEmail}
${date}

${greeting}

Me dirijo a ustedes para expresar mi interés en la posición de ${jobTitle} en ${company}. Como ${ctx.candidateTitle || "profesional"}, creo que mi trayectoria encaja bien con lo que buscan.

${skills}

${experience}

${placeholder}

Gracias por considerar mi candidatura. Me encantaría conversar sobre cómo mi experiencia puede aportar a los objetivos de ${company}.

Atentamente,
${ctx.candidateName}`
        : `${ctx.candidateName}
${ctx.candidateEmail}
${date}

${greeting}

I am writing to express my interest in the ${jobTitle} position at ${company}. As a ${ctx.candidateTitle || "professional"}, I believe my background aligns well with what you are looking for.

${skills}

${experience}

${placeholder}

Thank you for considering my application. I would welcome the opportunity to discuss how my experience can contribute to ${company}'s goals.

Sincerely,
${ctx.candidateName}`;

    return { body, placeholders: [placeholder] };
  }

  if (kind === "APPLICATION_EMAIL") {
    const subject =
      locale === "es"
        ? `Postulación para ${jobTitle} — ${ctx.candidateName}`
        : `Application for ${jobTitle} — ${ctx.candidateName}`;

    const body =
      locale === "es"
        ? `${greeting}

Me pongo en contacto para postular al puesto de ${jobTitle} en ${company}. Adjunto mi currículum para su revisión.

${skills}

${placeholder}

Quedo atento/a a cualquier información adicional que necesiten.

Saludos cordiales,
${ctx.candidateName}
${ctx.candidateEmail}`
        : `${greeting}

I am reaching out to apply for the ${jobTitle} role at ${company}. Please find my resume attached for your review.

${skills}

${placeholder}

Please let me know if you need any additional information.

Best regards,
${ctx.candidateName}
${ctx.candidateEmail}`;

    return { subject, body, placeholders: [placeholder] };
  }

  const subject =
    locale === "es"
      ? `Seguimiento — postulación ${jobTitle} en ${company}`
      : `Following up — ${jobTitle} application at ${company}`;

  const body =
    locale === "es"
      ? `${greeting}

Hace unas semanas envié mi postulación para el puesto de ${jobTitle} en ${company} y quería dar seguimiento para reiterar mi interés.

Sigo muy motivado/a por la oportunidad y creo que mi experiencia en ${formatSkillList(ctx.matchingSkills, locale) || "el área requerida"} encaja bien con lo que buscan.

${placeholder}

Gracias por su tiempo. Quedo disponible para una conversación cuando les sea conveniente.

Saludos cordiales,
${ctx.candidateName}
${ctx.candidateEmail}`
      : `${greeting}

I applied for the ${jobTitle} position at ${company} a couple of weeks ago and wanted to follow up to reiterate my interest.

I remain very enthusiastic about the opportunity and believe my experience with ${formatSkillList(ctx.matchingSkills, locale) || "the required area"} is a strong fit for what you need.

${placeholder}

Thank you for your time. I am available for a conversation whenever works best for you.

Best regards,
${ctx.candidateName}
${ctx.candidateEmail}`;

  return { subject, body, placeholders: [placeholder] };
}

export function extractMatchingSkillsForOutreach(
  analysis: JobAnalysisResult | null,
  profileSkills: string[]
): string[] {
  if (!analysis) {
    return profileSkills.slice(0, 5);
  }
  const combined = [
    ...analysis.requiredSkills,
    ...analysis.preferredSkills,
    ...analysis.technologies,
  ];
  const unique = Array.from(new Set(combined.map((s) => s.toLowerCase())));
  const profileLower = new Set(profileSkills.map((s) => s.toLowerCase()));
  const matched = unique.filter((skill) =>
    Array.from(profileLower).some((ps) => ps.includes(skill) || skill.includes(ps))
  );
  return matched.length > 0 ? matched.slice(0, 5) : unique.slice(0, 5);
}
