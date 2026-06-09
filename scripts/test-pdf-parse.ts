import fs from "fs";
import { parseResumePdf } from "../src/lib/resume/pdf-parser";

const path = process.argv[2];
if (!path) {
  console.error("Usage: npx tsx scripts/test-pdf-parse.ts <pdf-path>");
  process.exit(1);
}

async function main() {
  const buf = fs.readFileSync(path);
  const parsed = await parseResumePdf(buf);
  console.log(
    JSON.stringify(
      {
        name: `${parsed.firstName} ${parsed.lastName}`,
        title: parsed.professionalTitle,
        experiences: parsed.experiences.length,
        education: parsed.education.length,
        companies: parsed.experiences.map((e) => e.company),
      },
      null,
      2
    )
  );
}

main().catch(console.error);
