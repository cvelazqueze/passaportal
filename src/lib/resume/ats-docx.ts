import type { ResumeData } from "./types";
import { buildAdditionalInfo, formatAtsDate, formatContactLine } from "./ats-format";

const FONT = "Calibri";
const BODY_SIZE = 21; // half-points (10.5pt)
const NAME_SIZE = 30; // 15pt
const TITLE_SIZE = 22; // 11pt
const SECTION_SIZE = 21;

export async function generateAtsDocx(data: ResumeData): Promise<Buffer> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Tab,
    BorderStyle,
    TabStopType,
    TabStopPosition,
    convertInchesToTwip,
  } = await import("docx");

  const tabStops = [
    {
      type: TabStopType.RIGHT,
      position: TabStopPosition.MAX,
    },
  ];

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${data.firstName.toUpperCase()} ${data.lastName.toUpperCase()}`,
          font: FONT,
          size: NAME_SIZE,
          bold: true,
        }),
      ],
    })
  );

  if (data.professionalTitle) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: data.professionalTitle,
            font: FONT,
            size: TITLE_SIZE,
            bold: true,
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: formatContactLine(data),
          font: FONT,
          size: 19,
        }),
      ],
    })
  );

  function sectionHeading(title: string) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        border: {
          bottom: {
            color: "222222",
            size: 4,
            style: BorderStyle.SINGLE,
            space: 2,
          },
        },
        children: [
          new TextRun({
            text: title,
            font: FONT,
            size: SECTION_SIZE,
            bold: true,
          }),
        ],
      })
    );
  }

  function bulletParagraph(text: string) {
    return new Paragraph({
      spacing: { after: 40 },
      indent: { left: convertInchesToTwip(0.18), hanging: convertInchesToTwip(0.12) },
      children: [
        new TextRun({ text: "● ", font: FONT, size: 14 }),
        new TextRun({ text, font: FONT, size: BODY_SIZE }),
      ],
    });
  }

  if (data.experiences.length > 0) {
    sectionHeading("PROFESSIONAL EXPERIENCE");

    for (const exp of data.experiences) {
      const end = exp.isCurrent
        ? "PRESENT"
        : exp.endDate
          ? formatAtsDate(exp.endDate)
          : "";
      const dateRange = `${formatAtsDate(exp.startDate)} - ${end}`.trim();
      const companyLine = `${exp.company.toUpperCase()}${exp.location ? ` — ${exp.location}` : ""}`;

      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          tabStops,
          children: [
            new TextRun({ text: companyLine, font: FONT, size: BODY_SIZE, bold: true }),
            new Tab(),
            new TextRun({ text: dateRange, font: FONT, size: 19, bold: true }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: exp.position, font: FONT, size: BODY_SIZE, bold: true }),
          ],
        })
      );

      for (const bullet of [...exp.achievements, ...exp.responsibilities]) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (data.education.length > 0) {
    sectionHeading("EDUCATION");

    for (const edu of data.education) {
      const end = edu.endDate ? formatAtsDate(edu.endDate) : "";
      const start = formatAtsDate(edu.startDate);
      const dateRange = end ? `${start} - ${end}` : start;

      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          children: [
            new TextRun({
              text: `${edu.institution.toUpperCase()}${edu.location ? ` — ${edu.location}` : ""}`,
              font: FONT,
              size: BODY_SIZE,
              bold: true,
            }),
          ],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops,
          children: [
            new TextRun({ text: edu.degree, font: FONT, size: BODY_SIZE, bold: true }),
            new Tab(),
            new TextRun({ text: dateRange, font: FONT, size: 19, bold: true }),
          ],
        })
      );
    }
  }

  const additional = buildAdditionalInfo(data);
  if (additional.length > 0) {
    sectionHeading("ADDITIONAL INFORMATION");
    for (const item of additional) {
      children.push(bulletParagraph(item));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.55),
              left: convertInchesToTwip(0.58),
              right: convertInchesToTwip(0.58),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
