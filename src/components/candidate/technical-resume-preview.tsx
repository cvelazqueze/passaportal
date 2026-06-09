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
import styles from "./technical-resume-preview.module.css";

interface TechnicalResumePreviewProps {
  data: ResumeData;
  locale: Locale;
  labels: Dictionary["resume"];
  hubLabels: Dictionary["resumeHub"];
  label?: string;
  variant?: "preview" | "print";
}

export function TechnicalResumePreview({
  data,
  locale,
  labels,
  hubLabels,
  label,
  variant = "preview",
}: TechnicalResumePreviewProps) {
  const isPrint = variant === "print";
  const skills = getSkillList(data);
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
        <article className={shared.paper} aria-label="Technical resume preview">
          <div className={styles.content}>
            <aside className={styles.sidebar}>
              <h1 className={styles.name}>
                {formatResumeName(data)}
              </h1>
              {data.professionalTitle && (
                <p className={styles.title}>{data.professionalTitle}</p>
              )}

              <div className={styles.sidebarSection}>
                <h2 className={styles.sidebarTitle}>{labels.contact}</h2>
                <p className={styles.sidebarText}>{formatContactLine(data, "\n")}</p>
              </div>

              {skills.length > 0 && (
                <div className={styles.sidebarSection}>
                  <h2 className={styles.sidebarTitle}>{labels.coreStack}</h2>
                  <div>
                    {skills.map((skill) => (
                      <span key={skill} className={styles.skillTag}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.certifications.length > 0 && (
                <div className={styles.sidebarSection}>
                  <h2 className={styles.sidebarTitle}>{labels.certifications}</h2>
                  {data.certifications.map((cert) => (
                    <p key={cert.name} className={styles.sidebarText}>
                      {cert.name}
                      {cert.issueDate &&
                        ` (${new Date(cert.issueDate).getFullYear()})`}
                    </p>
                  ))}
                </div>
              )}
            </aside>

            <div className={styles.main}>
              {data.experiences.length > 0 && (
                <section>
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
                        <div className={styles.expHeader}>
                          <p className={styles.position}>{exp.position}</p>
                          <span className={styles.dates}>{dateRange}</span>
                        </div>
                        <p className={styles.company}>
                          {exp.company}
                          {exp.location ? ` · ${exp.location}` : ""}
                        </p>
                        {exp.technologies.length > 0 && (
                          <p className={styles.techLine}>
                            {labels.technologies}: {exp.technologies.join(", ")}
                          </p>
                        )}
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
                <section>
                  <h2 className={styles.sectionTitle}>{labels.education}</h2>
                  {data.education.map((edu, idx) => (
                    <div key={idx} className={styles.eduBlock}>
                      <p className={styles.eduDegree}>{edu.degree}</p>
                      <p className={styles.eduSchool}>
                        {edu.institution}
                        {edu.endDate &&
                          ` · ${formatResumeDate(edu.endDate, locale)}`}
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
