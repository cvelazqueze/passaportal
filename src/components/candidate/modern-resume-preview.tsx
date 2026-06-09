import type { ResumeData } from "@/lib/resume/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  formatContactLine,
  formatResumeDate,
  getSkillList,
  presentLabel,
} from "@/lib/resume/format";
import { formatResumeName } from "@/lib/resume/format-resume-name";
import shared from "./resume-preview-shared.module.css";
import styles from "./modern-resume-preview.module.css";

interface ModernResumePreviewProps {
  data: ResumeData;
  locale: Locale;
  labels: Dictionary["resume"];
  hubLabels: Dictionary["resumeHub"];
  label?: string;
  variant?: "preview" | "print";
}

export function ModernResumePreview({
  data,
  locale,
  labels,
  hubLabels,
  label,
  variant = "preview",
}: ModernResumePreviewProps) {
  const isPrint = variant === "print";
  const skills = getSkillList(data);
  const contactParts = formatContactLine(data, "|").split("|").map((s) => s.trim());
  const hasContent = data.experiences.length > 0 || skills.length > 0;

  if (!hasContent) {
    return <div className={shared.empty}>{hubLabels.noContent}</div>;
  }

  return (
    <div>
      {label && !isPrint && (
        <p className="mb-3 text-sm text-muted-foreground">{label}</p>
      )}
      <div className={isPrint ? shared.printCanvas : shared.sharedCanvas}>
        <article className={shared.paper} aria-label="Modern resume preview">
          <header className={styles.header}>
            <h1 className={styles.headerName}>
              {formatResumeName(data)}
            </h1>
            {data.professionalTitle && (
              <p className={styles.headerTitle}>{data.professionalTitle}</p>
            )}
            <div className={styles.headerContact}>
              {contactParts.map((part) => (
                <span key={part}>{part}</span>
              ))}
            </div>
          </header>

          <div className={styles.content}>
            {skills.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{labels.technicalSkills}</h2>
                <div className={styles.skillsRow}>
                  {skills.map((skill) => (
                    <span key={skill} className={styles.skillPill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {data.experiences.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{labels.experience}</h2>
                {data.experiences.map((exp, idx) => {
                  const end = exp.isCurrent
                    ? presentLabel(locale)
                    : exp.endDate
                      ? formatResumeDate(exp.endDate, locale)
                      : "";
                  const dateRange = `${formatResumeDate(exp.startDate, locale)} – ${end}`;
                  const bullets = [...exp.achievements, ...exp.responsibilities];

                  return (
                    <div key={idx} className={styles.experienceBlock}>
                      <div className={styles.expRow}>
                        <p className={styles.position}>{exp.position}</p>
                        <span className={styles.dates}>{dateRange}</span>
                      </div>
                      <p className={styles.company}>
                        {exp.company}
                        {exp.location ? ` · ${exp.location}` : ""}
                      </p>
                      {bullets.length > 0 && (
                        <ul className={shared.bulletList}>
                          {bullets.map((bullet, bi) => (
                            <li key={bi} className={shared.bullet}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {data.education.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{labels.education}</h2>
                {data.education.map((edu, idx) => (
                  <div key={idx} className={styles.eduBlock}>
                    <p className={styles.eduLine}>{edu.degree}</p>
                    <p className={styles.eduSub}>
                      {edu.institution}
                      {edu.endDate && ` · ${formatResumeDate(edu.endDate, locale)}`}
                    </p>
                  </div>
                ))}
              </section>
            )}

            {data.certifications.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{labels.certifications}</h2>
                {data.certifications.map((cert) => (
                  <p key={cert.name} className={styles.eduSub}>
                    {cert.name} — {cert.issuer}
                  </p>
                ))}
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
