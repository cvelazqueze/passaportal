import { describe, it, expect } from "vitest";
import { parseResumeText } from "@/lib/resume/pdf-parser";

const CESAR_RESUME = `CESAR VELAZQUEZ
Fullstack Engineer
• ing.cesarvelazquez@gmail.com • +52 (871) 281-9340 • linkedin.com/in/cesarvelazqueze
PROFESSIONAL EXPERIENCE
PWC ( FORMERLY KUNAI ) — Remote 	APRIL 2025 - PRESENT
Sr. Associate - Lead Fullstack Engineer
● Designed and developed scalable backend and full-stack solutions using Node.js, TypeScript,
AWS, PostgreSQL, and React.
UNOSQUARE— Remote 	OCT 2024 - APRIL 2025
Sr. Fullstack Engineer
● Developed and maintained backend and frontend components using NodeJS, JavaScript, and
React.
EDUCATION
INSTITUTO TECNOLOGICO DE LA LAGUNA 	Torreon, Coahuila
Master of Science - Computational Engineering 	JAN 2016 - DEC 2017
ADDITIONAL INFORMATION
● Certifications: Apollo Graph Developer - Associate Certification (2025), BPMN (2017)
● Github Portfolio: https://github.com/cvelazqueze`;

const WRAPPED_BULLET_RESUME = `CESAR VELAZQUEZ
Fullstack Engineer
PROFESSIONAL EXPERIENCE
PWC — Remote APRIL 2025 - PRESENT
Sr. Associate - Lead Fullstack Engineer
● Designed and developed scalable backend and full-stack solutions using Node.js,
● TypeScript,
● Delivered mid-to-large features independently, collaborating with stakeholders to
● refine requirements and ship production-ready code.
● Mentored mid-level and junior engineers through code reviews, design discussions,
● and pair programming sessions.
EDUCATION
INSTITUTO TECNOLOGICO DE LA LAGUNA
Master of Science  JAN 2016 - DEC 2017`;

describe("PDF Resume Parser", () => {
  it("extracts header and contact info", () => {
    const parsed = parseResumeText(CESAR_RESUME);
    expect(parsed.firstName).toBe("Cesar");
    expect(parsed.lastName).toBe("Velazquez");
    expect(parsed.professionalTitle).toBe("Fullstack Engineer");
    expect(parsed.email).toBe("ing.cesarvelazquez@gmail.com");
    expect(parsed.phone).toContain("871");
    expect(parsed.linkedIn).toContain("linkedin.com");
  });

  it("extracts experiences with technologies", () => {
    const parsed = parseResumeText(CESAR_RESUME);
    expect(parsed.experiences.length).toBeGreaterThanOrEqual(2);
    const pwc = parsed.experiences.find((e) => e.company.toUpperCase().includes("PWC"));
    expect(pwc).toBeDefined();
    expect(pwc?.position).toContain("Lead Fullstack");
    expect(pwc?.isCurrent).toBe(true);
    expect(pwc?.technologies).toContain("TypeScript");
    expect(pwc?.technologies).toContain("Node.js");
  });

  it("extracts education and certifications", () => {
    const parsed = parseResumeText(CESAR_RESUME);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education[0].institution).toContain("TECNOLOGICO");
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
    expect(parsed.github).toContain("github.com");
  });

  it("merges wrapped PDF bullets that repeat bullet markers on each line", () => {
    const parsed = parseResumeText(WRAPPED_BULLET_RESUME);
    const pwc = parsed.experiences.find((e) => e.company.toUpperCase().includes("PWC"));
    expect(pwc).toBeDefined();
    expect(pwc!.bullets.length).toBe(3);
    expect(pwc!.bullets[0]).toContain("Node.js");
    expect(pwc!.bullets[0]).toContain("TypeScript");
    expect(pwc!.bullets[1]).toContain("refine requirements");
    expect(pwc!.bullets[2]).toContain("pair programming");
  });
});
