import type { ResumeData } from "./types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatResumeDate, presentLabel } from "./format";
import { formatResumeName } from "./format-resume-name";

const FONT = "Georgia";

export async function generateExecutiveDocx(
  data: ResumeData,
  labels: Dictionary["resume"],
  locale: Locale
): Promise<Buffer> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    convertInchesToTwip,
  } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: formatResumeName(data, { uppercase: true }),
          font: FONT,
          size: 36,
          bold: true,
          characterSpacing: 40,
        }),
      ],
    })
  );

  if (data.professionalTitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: data.professionalTitle,
            font: FONT,
            size: 22,
            italics: true,
          }),
        ],
      })
    );
  }

  const contactParts = [data.email];
  if (data.phone) contactParts.push(data.phone);
  if (data.city || data.country) {
    contactParts.push([data.city, data.country].filter(Boolean).join(", "));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        bottom: { color: "1a1a1a", size: 8, style: BorderStyle.SINGLE, space: 4 },
      },
      children: [
        new TextRun({
          text: contactParts.join("  |  "),
          font: "Calibri",
          size: 19,
        }),
      ],
    })
  );

  function sectionHeading(title: string) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({ text: title, font: FONT, size: 22, bold: true, characterSpacing: 30 }),
        ],
      })
    );
    children.push(
      new Paragraph({
        border: {
          bottom: { color: "9ca3af", size: 4, style: BorderStyle.SINGLE },
        },
        spacing: { after: 120 },
      })
    );
  }

  function bulletParagraph(text: string) {
    return new Paragraph({
      spacing: { after: 50 },
      indent: { left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.12) },
      children: [
        new TextRun({ text: "▪ ", font: "Calibri", size: 16 }),
        new TextRun({ text, font: "Calibri", size: 20 }),
      ],
    });
  }

  if (data.experiences.length > 0) {
    sectionHeading(labels.professionalExperience);

    for (const exp of data.experiences) {
      const end = exp.isCurrent
        ? presentLabel(locale)
        : exp.endDate
          ? formatResumeDate(exp.endDate, locale)
          : "";
      const dateRange = `${formatResumeDate(exp.startDate, locale)} – ${end}`;

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 30 },
          children: [
            new TextRun({ text: exp.position, font: "Calibri", size: 22, bold: true }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: exp.company, font: "Calibri", size: 20, bold: true }),
            new TextRun({
              text: ` | ${dateRange}`,
              font: "Calibri",
              size: 20,
            }),
          ],
        })
      );

      for (const bullet of [...exp.achievements, ...exp.responsibilities]) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (data.education.length > 0) {
    sectionHeading(labels.education.toUpperCase());
    for (const edu of data.education) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
          children: [
            new TextRun({ text: edu.degree, font: "Calibri", size: 20, bold: true }),
            new TextRun({
              text: `, ${edu.institution}`,
              font: "Calibri",
              size: 20,
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.55),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.65),
              right: convertInchesToTwip(0.65),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
