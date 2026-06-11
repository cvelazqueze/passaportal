import { z } from "zod";
import { parseList } from "@/lib/candidate/opportunity-schema";

export const OFFER_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "MXN", "COP", "ARS", "BRL"] as const;

export const offerBodySchema = z.object({
  applicationId: z.string().min(1, "Opportunity is required"),
  baseSalary: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().default("USD"),
  bonus: z.string().optional().nullable(),
  ptoDays: z.number().int().nonnegative().optional().nullable(),
  remotePolicy: z.string().optional().nullable(),
  benefits: z.array(z.string()).default([]),
  contractType: z.string().optional().nullable(),
  equipment: z.string().optional().nullable(),
  insurance: z.string().optional().nullable(),
  flexibility: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isAccepted: z.boolean().default(false),
});

export function parseBenefits(text: string): string[] {
  return parseList(text);
}
