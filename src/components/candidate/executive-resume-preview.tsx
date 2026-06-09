import type { ResumeData } from "@/lib/resume/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  formatResumeDate,
  presentLabel,
} from "@/lib/resume/format";
import shared from "./resume-preview-shared.module.css";
import styles from "./executive-resume-preview.module.css";

interface ExecutiveResumePreviewProps {
  data: ResumeData;
  locale: Locale;
  labels: Dictionary["resume"];
  hubLabels: Dictionary["resumeHub"];
  label?: string;
  variant?: "preview" | "print";
}

function buildExecutiveContact(data: ResumeData): string {
  const parts = [data.email];
  if (data.phone) parts.push(data.phone);
  if (data.city || data.country) {
    parts.push([data.city, data.country].filter(Boolean).join(", "));
  }
  if (data.linkedIn) parts.push(data.linkedIn.replace(/^https?:\/\//, ""));
  return parts.join("  |  ");
}

export function ExecutiveResumePreview({
  data,
  locale,
  labels,
  hubLabels,
  label,
  variant = "preview",
}: ExecutiveResumePreviewProps) {
  const isPrint = variant === "print";
  const hasContent =
    data.experiences.length > 0 ||
    data.education.length > 0 ||
    data.certifications.length > 0;

  if (!hasContent) {
    return <div className={shared.empty}>{hubLabels.noContent}</div>;
  }

  return (
    <div>
      {label && !isPrint && (
        <p className="mb-3 text-sm text-muted-foreground">{label}</p>
      )}
      <div className={isPrint ? shared.printCanvas : shared.sharedCanvas}>
        <article className={shared.paper} aria-label="Executive resume preview">
          <div className={styles.content}>
            <header className={styles.header}>
              <h1 className={styles.name}>
                {data.firstName} {data.lastName}
              </h1>
              {data.professionalTitle && (
                <p className={styles.title}>{data.professionalTitle}</p>
              )}
              <p className={styles.contact}>{buildExecutiveContact(data)}</p>
            </header>

            <div className={styles.body}>
              {data.experiences.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    {labels.professionalExperience}
                  </h2>
                  <hr className={styles.sectionRule} />
                  {data.experiences.map((exp, idx) => {
                    const end = exp.isCurrent
                      ? presentLabel(locale)
                      : exp.endDate
                        ? formatResumeDate(exp.endDate, locale)
                        : "";
                    const dateRange = `${formatResumeDate(exp.startDate, locale)} – ${end}`;
                    const bullets = [
                      ...exp.achievements,
                      ...exp.responsibilities,
                    ];

                    return (
                      <div key={idx} className={styles.experienceBlock}>
                        <div className={styles.expHeader}>
                          <p className={styles.position}>{exp.position}</p>
                          <p className={styles.companyLine}>
                            <strong>{exp.company}</strong>
                            {exp.location && ` · ${exp.location}`}
                            <span className={styles.dates}> | {dateRange}</span>
                          </p>
                        </div>
                        {bullets.length > 0 && (
                          <ul className={styles.bulletList}>
                            {bullets.map((bullet, bi) => (
                              <li key={bi} className={styles.bullet}>
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
                  <h2 className={styles.sectionTitle}>
                    {labels.education.toUpperCase()}
                  </h2>
                  <hr className={styles.sectionRule} />
                  {data.education.map((edu, idx) => (
                    <div key={idx} className={styles.eduBlock}>
                      <p className={styles.eduLine}>
                        <span className={styles.eduDegree}>{edu.degree}</span>
                        {", "}
                        {edu.institution}
                        {edu.endDate &&
                          ` · ${formatResumeDate(edu.endDate, locale)}`}
                      </p>
                    </div>
                  ))}
                </section>
              )}

              {data.certifications.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    {labels.certifications.toUpperCase()}
                  </h2>
                  <hr className={styles.sectionRule} />
                  {data.certifications.map((cert) => (
                    <div key={cert.name} className={styles.certBlock}>
                      <p className={styles.certLine}>
                        {cert.name} — {cert.issuer}
                      </p>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
