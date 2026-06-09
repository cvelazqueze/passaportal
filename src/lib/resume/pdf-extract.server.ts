import "server-only";

// pdf-parse must load via require — ESM/webpack bundling breaks pdfjs in Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer
) => Promise<{ text: string }>;

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
