import type { ResumeData } from "@/lib/resume/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  buildAdditionalInfo,
  formatContactLine,
  formatResumeDate,
  presentLabel,
} from "@/lib/resume/format";
import shared from "./resume-preview-shared.module.css";
import styles from "./ats-resume-preview.module.css";

const PAGE_HEIGHT_IN = 11;

interface AtsResumePreviewProps {
  data: ResumeData;
  locale: Locale;
  labels: Dictionary["resume"];
  hubLabels: Dictionary["resumeHub"];
  label?: string;
  variant?: "preview" | "print";
}

function estimatePageCount(data: ResumeData): number {
  let units = 3;
  for (const exp of data.experiences) {
    units += 2.2;
    units += (exp.achievements.length + exp.responsibilities.length) * 0.55;
  }
  units += data.education.length * 1.4;
  units += (data.certifications.length + data.skills.length) * 0.35;
  return Math.max(1, Math.ceil(units / 42));
}

export function AtsResumePreview({
  data,
  locale,
  labels,
  hubLabels,
  label,
  variant = "preview",
}: AtsResumePreviewProps) {
  const additional = buildAdditionalInfo(data, labels);
  const isPrint = variant === "print";
  const pageCount = estimatePageCount(data);
  const hasContent =
    data.experiences.length > 0 ||
    data.education.length > 0 ||
    additional.length > 0;

  if (!hasContent) {
    return <div className={shared.empty}>{hubLabels.noContent}</div>;
  }

  const pageLabels = Array.from({ length: pageCount }, (_, i) => (
    <span
      key={i}
      className={shared.pageLabel}
      style={{ top: `calc(${i * PAGE_HEIGHT_IN}in + 0.2in)` }}
    >
      {hubLabels.page} {i + 1}
    </span>
  ));

  return (
    <div>
      {label && !isPrint && (
        <p className="mb-3 text-sm text-muted-foreground">
          {label}
          {pageCount > 1 && (
            <span className="ml-2 text-xs">
              · ~{pageCount} {hubLabels.pagesAtLetter}
            </span>
          )}
        </p>
      )}
      <div className={isPrint ? shared.printCanvas : shared.sharedCanvas}>
        <article
          className={shared.paper}
          aria-label="ATS resume preview"
          style={isPrint ? undefined : { minHeight: `${pageCount * PAGE_HEIGHT_IN}in` }}
        >
          {!isPrint && (
            <>
              <div
                className={shared.pageGuides}
                style={{ height: `${pageCount * PAGE_HEIGHT_IN}in` }}
              />
              {pageLabels}
            </>
          )}
          <div className={styles.content}>
            <header>
              <h1 className={styles.name}>
                {data.firstName.toUpperCase()} {data.lastName.toUpperCase()}
              </h1>
              {data.professionalTitle && (
                <p className={styles.title}>{data.professionalTitle}</p>
              )}
              <p className={styles.contact}>{formatContactLine(data, " • ")}</p>
            </header>

            {data.experiences.length > 0 && (
              <section>
                <h2 className={styles.sectionTitle}>{labels.professionalExperience}</h2>
                {data.experiences.map((exp, idx) => {
                  const end = exp.isCurrent
                    ? presentLabel(locale, true)
                    : exp.endDate
                      ? formatResumeDate(exp.endDate, locale, true)
                      : "";
                  const dateRange = `${formatResumeDate(exp.startDate, locale, true)} - ${end}`.trim();
                  const bullets = [...exp.achievements, ...exp.responsibilities];

                  return (
                    <div key={idx} className={styles.experienceBlock}>
                      <div className={styles.experienceHeader}>
                        <span className={styles.company}>
                          {exp.company.toUpperCase()}
                          {exp.location ? ` — ${exp.location}` : ""}
                        </span>
                        <span className={styles.dates}>{dateRange}</span>
                      </div>
                      <p className={styles.position}>{exp.position}</p>
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
                <h2 className={styles.sectionTitle}>{labels.education.toUpperCase()}</h2>
                {data.education.map((edu, idx) => {
                  const end = edu.endDate ? formatResumeDate(edu.endDate, locale, true) : "";
                  const start = formatResumeDate(edu.startDate, locale, true);
                  const dateRange = end ? `${start} - ${end}` : start;

                  return (
                    <div key={idx} className={styles.eduBlock}>
                      <p className={styles.eduInstitution}>
                        {edu.institution.toUpperCase()}
                        {edu.location ? ` — ${edu.location}` : ""}
                      </p>
                      <div className={styles.eduRow}>
                        <span className={styles.eduDegree}>{edu.degree}</span>
                        <span className={styles.dates}>{dateRange}</span>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {additional.length > 0 && (
              <section>
                <h2 className={styles.sectionTitle}>{labels.additionalInfo.toUpperCase()}</h2>
                <ul className={styles.additionalList}>
                  {additional.map((item, idx) => (
                    <li key={idx} className={styles.additionalItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
