import { OutreachKind } from "@prisma/client";
import { z } from "zod";

export const outreachGenerateSchema = z.object({
  kind: z.nativeEnum(OutreachKind),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  description: z.string().optional(),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  applicationId: z.string().optional(),
});

export const outreachDraftSchema = z.object({
  kind: z.nativeEnum(OutreachKind),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  recipientName: z.string().optional(),
  recipientEmail: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  applicationId: z.string().optional().nullable(),
});

export const outreachUpdateSchema = outreachDraftSchema.partial().extend({
  body: z.string().min(1).optional(),
});
